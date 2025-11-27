import { describe, it, expect, beforeEach, vi } from 'vitest'
import { dictionaryService } from '@/services/dictionary-service'
import type { DictionaryEntry } from '@/services/dictionary-service'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as any

// Mock axios.isAxiosError
vi.spyOn(axios, 'isAxiosError').mockImplementation((error: any) => {
  return error?.isAxiosError === true
})

describe('DictionaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dictionaryService.clearCache()
  })

  describe('lookupWord', () => {
    it('should fetch dictionary entry for a valid word', async () => {
      const mockEntry: DictionaryEntry = {
        word: 'hello',
        phonetic: '/həˈloʊ/',
        phonetics: [
          { text: '/həˈloʊ/', audio: 'https://example.com/hello.mp3' }
        ],
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: [
              {
                definition: 'a greeting',
                example: 'Hello, how are you?',
                synonyms: ['hi', 'greeting'],
                antonyms: ['goodbye']
              }
            ]
          }
        ]
      }

      mockedAxios.get.mockResolvedValue({
        data: [mockEntry]
      })

      const result = await dictionaryService.lookupWord('hello')

      expect(result).toEqual(mockEntry)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('hello'),
        expect.objectContaining({
          timeout: expect.any(Number)
        })
      )
    })

    it('should return null for word not found (404)', async () => {
      const axiosError = {
        response: { status: 404 },
        isAxiosError: true
      }
      
      // Mock axios.isAxiosError to return true
      vi.mocked(axios.isAxiosError).mockReturnValue(true)
      
      mockedAxios.get.mockRejectedValue(axiosError)

      const result = await dictionaryService.lookupWord('nonexistentword')

      expect(result).toBeNull()
    })

    it('should throw NetworkError for network failures', async () => {
      mockedAxios.get.mockRejectedValue({
        message: 'Network Error',
        isAxiosError: true
      })

      await expect(dictionaryService.lookupWord('hello')).rejects.toThrow()
    })

    it('should use cache for repeated lookups', async () => {
      const mockEntry: DictionaryEntry = {
        word: 'hello',
        phonetic: '/həˈloʊ/',
        meanings: []
      }

      mockedAxios.get.mockResolvedValueOnce({
        data: [mockEntry]
      })

      // First lookup
      await dictionaryService.lookupWord('hello')
      expect(mockedAxios.get).toHaveBeenCalledTimes(1)

      // Second lookup should use cache
      const result = await dictionaryService.lookupWord('hello')
      expect(mockedAxios.get).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockEntry)
    })

    it('should handle empty response', async () => {
      mockedAxios.get.mockResolvedValue({
        data: []
      })

      const result = await dictionaryService.lookupWord('hello')
      expect(result).toBeNull()
    })
  })

  describe('convertToWord', () => {
    it('should convert dictionary entry to Word object', () => {
      const entry: DictionaryEntry = {
        word: 'hello',
        // 如果同時有 phonetic 和 phonetics，phonetic 會優先，但 audio 在 phonetics 中
        // 所以這裡只使用 phonetics 來確保 audio 被提取
        phonetics: [
          { text: '/həˈloʊ/', audio: 'https://example.com/hello.mp3' }
        ],
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: [
              {
                definition: 'a greeting',
                example: 'Hello, how are you?',
                synonyms: ['hi'],
                antonyms: ['goodbye']
              }
            ]
          }
        ]
      }

      const word = dictionaryService.convertToWord('hello', entry)

      expect(word.lemma).toBe('hello')
      expect(word.phonetics).toContain('/həˈloʊ/')
      expect(word.audioUrls).toContain('https://example.com/hello.mp3')
      expect(word.partOfSpeech).toBe('noun')
      expect(word.definitionEn).toBe('a greeting')
      expect(word.examples).toContain('Hello, how are you?')
      expect(word.synonyms).toContain('hi')
      expect(word.antonyms).toContain('goodbye')
      expect(word.infoCompleteness).toBe('complete')
    })

    it('should handle null entry', () => {
      const word = dictionaryService.convertToWord('hello', null)

      expect(word.lemma).toBe('hello')
      expect(word.definitionEn).toBe('')
      expect(word.definitionZh).toBe('')
      expect(word.infoCompleteness).toBe('missing-definition')
    })

    it('should extract multiple examples from different meanings', () => {
      const entry: DictionaryEntry = {
        word: 'test',
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: [
              { definition: 'definition 1', example: 'example 1' },
              { definition: 'definition 2', example: 'example 2' }
            ]
          },
          {
            partOfSpeech: 'verb',
            definitions: [
              { definition: 'definition 3', example: 'example 3' }
            ]
          }
        ]
      }

      const word = dictionaryService.convertToWord('test', entry)

      expect(word.examples.length).toBeGreaterThanOrEqual(1)
      expect(word.examples.length).toBeLessThanOrEqual(5)
    })
  })

  describe('enrichWord', () => {
    it('should enrich word with dictionary data', async () => {
      const mockEntry: DictionaryEntry = {
        word: 'hello',
        phonetic: '/həˈloʊ/',
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: [
              { definition: 'a greeting' }
            ]
          }
        ]
      }

      mockedAxios.get.mockResolvedValue({
        data: [mockEntry]
      })

      const result = await dictionaryService.enrichWord('hello')

      expect(result.success).toBe(true)
      expect(result.word.lemma).toBe('hello')
      expect(result.word.definitionEn).toBe('a greeting')
    })

    it('should handle failed lookup gracefully', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 404 },
        isAxiosError: true
      })

      const result = await dictionaryService.enrichWord('nonexistent')

      expect(result.success).toBe(false)
      expect(result.word.lemma).toBe('nonexistent')
      expect(result.word.infoCompleteness).toBe('missing-definition')
    })

    it('should retry on network failure', async () => {
      mockedAxios.get
        .mockRejectedValueOnce({
          message: 'Network Error',
          isAxiosError: true
        })
        .mockResolvedValueOnce({
          data: [{
            word: 'hello',
            meanings: []
          }]
        })

      // Mock setTimeout to speed up test
      vi.useFakeTimers()
      const promise = dictionaryService.enrichWord('hello')
      
      // Fast-forward time
      await vi.runAllTimersAsync()
      
      const result = await promise

      expect(result.success).toBe(true)
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
      
      vi.useRealTimers()
    })
  })

  describe('enrichWords', () => {
    it('should enrich multiple words with progress callback', async () => {
      const mockEntry: DictionaryEntry = {
        word: 'test',
        meanings: []
      }

      mockedAxios.get.mockResolvedValue({
        data: [mockEntry]
      })

      const progressCalls: Array<[number, number, string]> = []
      const words = ['word1', 'word2', 'word3']

      const results = await dictionaryService.enrichWords(words, (current, total, word) => {
        progressCalls.push([current, total, word])
      })

      expect(results.length).toBe(3)
      expect(progressCalls.length).toBe(3)
      expect(progressCalls[0]).toEqual([1, 3, 'word1'])
      expect(progressCalls[1]).toEqual([2, 3, 'word2'])
      expect(progressCalls[2]).toEqual([3, 3, 'word3'])
    })
  })

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      const mockEntry: DictionaryEntry = {
        word: 'hello',
        meanings: []
      }

      mockedAxios.get.mockResolvedValue({
        data: [mockEntry]
      })

      // First lookup
      await dictionaryService.lookupWord('hello')
      expect(mockedAxios.get).toHaveBeenCalledTimes(1)

      // Second lookup uses cache
      await dictionaryService.lookupWord('hello')
      expect(mockedAxios.get).toHaveBeenCalledTimes(1)

      // Clear cache
      dictionaryService.clearCache()

      // Third lookup should fetch again
      await dictionaryService.lookupWord('hello')
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    })
  })
})

