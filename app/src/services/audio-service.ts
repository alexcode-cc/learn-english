import { logger } from '@/utils/logger'

export class AudioService {
  private audioCache = new Map<string, HTMLAudioElement>()

  async playAudio(url: string): Promise<void> {
    try {
      let audio = this.audioCache.get(url)
      if (!audio) {
        audio = new Audio(url)
        this.audioCache.set(url, audio)
      }

      await audio.play()
      logger.debug('Audio played', { url })
    } catch (error) {
      logger.error('Failed to play audio', { url, error })
      throw error
    }
  }

  async playPronunciation(word: string): Promise<void> {
    // Use Web Speech API as fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
      logger.debug('Pronunciation played via TTS', { word })
    } else {
      throw new Error('Speech synthesis not supported')
    }
  }

  clearCache(): void {
    this.audioCache.clear()
  }
}

export const audioService = new AudioService()

