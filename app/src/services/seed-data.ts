import { createWord } from '@/types/word'
import { wordRepository } from './word-repository'
import { logger } from '@/utils/logger'

const sampleWords = [
  {
    lemma: 'hello',
    definitionEn: 'a greeting used when meeting or answering the telephone',
    definitionZh: '你好；哈囉',
    partOfSpeech: 'interjection',
    phonetics: ['həˈloʊ'],
    examples: [
      'Hello, how are you?',
      'Hello, this is John speaking.'
    ],
    synonyms: ['hi', 'greetings', 'hey'],
    antonyms: ['goodbye', 'farewell']
  },
  {
    lemma: 'world',
    definitionEn: 'the earth and all the people, places, and things on it',
    definitionZh: '世界；地球',
    partOfSpeech: 'noun',
    phonetics: ['wɜːrld'],
    examples: [
      'People from all over the world came to the conference.',
      'The world is changing rapidly.'
    ],
    synonyms: ['earth', 'globe', 'planet'],
    antonyms: []
  },
  {
    lemma: 'beautiful',
    definitionEn: 'having qualities that give great pleasure or satisfaction to see, hear, or think about',
    definitionZh: '美麗的；漂亮的',
    partOfSpeech: 'adjective',
    phonetics: ['ˈbjuːtɪfəl'],
    examples: [
      'She has a beautiful smile.',
      'The sunset was beautiful tonight.'
    ],
    synonyms: ['pretty', 'lovely', 'attractive', 'gorgeous'],
    antonyms: ['ugly', 'unattractive']
  },
  {
    lemma: 'learn',
    definitionEn: 'to gain knowledge or understanding of or skill in by study, instruction, or experience',
    definitionZh: '學習；學會',
    partOfSpeech: 'verb',
    phonetics: ['lɜːrn'],
    examples: [
      'Children learn to read and write at school.',
      'I am learning English vocabulary.'
    ],
    synonyms: ['study', 'master', 'acquire'],
    antonyms: ['forget', 'unlearn']
  },
  {
    lemma: 'vocabulary',
    definitionEn: 'the body of words used in a particular language or in a particular field of knowledge',
    definitionZh: '詞彙；單字表',
    partOfSpeech: 'noun',
    phonetics: ['voʊˈkæbjəˌleri'],
    examples: [
      'She has an extensive vocabulary.',
      'Learning new vocabulary is important for language study.'
    ],
    synonyms: ['lexicon', 'wordlist', 'terminology'],
    antonyms: []
  },
  {
    lemma: 'example',
    definitionEn: 'a thing characteristic of its kind or illustrating a general rule',
    definitionZh: '例子；範例',
    partOfSpeech: 'noun',
    phonetics: ['ɪɡˈzæmpəl'],
    examples: [
      'This is a good example of modern architecture.',
      'Can you give me an example?'
    ],
    synonyms: ['instance', 'sample', 'illustration'],
    antonyms: []
  },
  {
    lemma: 'practice',
    definitionEn: 'the actual application or use of an idea, belief, or method, as opposed to theories relating to it',
    definitionZh: '練習；實踐',
    partOfSpeech: 'noun',
    phonetics: ['ˈpræktɪs'],
    examples: [
      'Practice makes perfect.',
      'She needs more practice speaking English.'
    ],
    synonyms: ['exercise', 'training', 'rehearsal'],
    antonyms: ['theory']
  },
  {
    lemma: 'remember',
    definitionEn: 'to have in or be able to bring to one\'s mind an awareness of (someone or something from the past)',
    definitionZh: '記得；記住',
    partOfSpeech: 'verb',
    phonetics: ['rɪˈmembər'],
    examples: [
      'I remember meeting him last year.',
      'Please remember to bring your homework.'
    ],
    synonyms: ['recall', 'recollect', 'memorize'],
    antonyms: ['forget']
  }
]

export async function seedSampleWords(): Promise<void> {
  try {
    const existingWords = await wordRepository.getAll()
    
    // Only seed if database is empty
    if (existingWords.length > 0) {
      logger.info('Database already contains words, skipping seed', {
        count: existingWords.length
      })
      return
    }

    logger.info('Seeding sample words', { count: sampleWords.length })

    for (const wordData of sampleWords) {
      const word = createWord(wordData.lemma, 'manual')
      word.definitionEn = wordData.definitionEn
      word.definitionZh = wordData.definitionZh
      word.partOfSpeech = wordData.partOfSpeech
      word.phonetics = wordData.phonetics
      word.examples = wordData.examples
      word.synonyms = wordData.synonyms
      word.antonyms = wordData.antonyms
      word.infoCompleteness = 'complete'
      word.status = 'unlearned'

      await wordRepository.create(word)
    }

    logger.info('Sample words seeded successfully', {
      count: sampleWords.length
    })
  } catch (error) {
    logger.error('Failed to seed sample words', { error })
    throw error
  }
}

