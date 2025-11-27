import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WordCard from '@/components/cards/WordCard.vue'
import { createWord } from '@/types/word'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify()

describe('WordCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render word lemma on front side', () => {
    const word = createWord('hello')
    word.definitionZh = '你好'
    word.partOfSpeech = 'noun'

    const wrapper = mount(WordCard, {
      props: { word },
      global: {
        plugins: [vuetify]
      }
    })

    expect(wrapper.text()).toContain('hello')
    expect(wrapper.text()).toContain('你好')
  })

  it('should flip card on click', async () => {
    const word = createWord('test')
    word.definitionEn = 'a test'
    word.definitionZh = '測試'

    const wrapper = mount(WordCard, {
      props: { word },
      global: {
        plugins: [vuetify]
      }
    })

    const card = wrapper.find('.word-card')
    expect(card.classes()).not.toContain('flipped')

    await card.trigger('click')
    expect(card.classes()).toContain('flipped')
  })

  it('should display detailed information on back side', async () => {
    const word = createWord('example')
    word.definitionEn = 'an example'
    word.definitionZh = '範例'
    word.examples = ['This is an example.']
    word.synonyms = ['sample', 'instance']

    const wrapper = mount(WordCard, {
      props: { word },
      global: {
        plugins: [vuetify]
      }
    })

    await wrapper.find('.word-card').trigger('click')

    expect(wrapper.text()).toContain('an example')
    expect(wrapper.text()).toContain('範例')
  })
})

