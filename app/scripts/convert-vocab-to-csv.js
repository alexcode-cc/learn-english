#!/usr/bin/env node

/**
 * 將單字文字檔轉換為 CSV 格式（含網路搜尋補足資訊）
 * 
 * 輸入格式（每 6 行為一組）：
 * 1. 序號
 * 2. 空行
 * 3. 單字字彙
 * 4. 空行
 * 5. 單字解釋
 * 6. 空行
 * 
 * 輸出格式：CSV 檔案，包含以下欄位：
 * - ID（序號）
 * - 單字
 * - 音標（從網路搜尋）
 * - 發音音檔連結（從網路搜尋）
 * - 詞類（從網路搜尋）
 * - 解釋（原始檔案中的解釋）
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { extname } from 'node:path'
import axios from 'axios'

const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en'
// 備用字典 API（使用另一個免費的字典 API）
// 注意：目前使用相同的 API，但可以切換到其他 API
const FALLBACK_API_ENABLED = true // 啟用備用 API
const DELAY_BETWEEN_REQUESTS = 500 // 毫秒，避免 API 限流（增加到 500ms）
const MAX_RETRIES = 3 // 最大重試次數

/**
 * 正規化音標格式（移除方括號，統一格式）
 */
function normalizePhonetic(phonetic) {
  if (!phonetic) return ''
  // 移除方括號 [ ] 和圓括號 ( )
  let normalized = phonetic.replace(/[[\]()]/g, '')
  // 如果音標以 / 開頭和結尾，保持不變；否則加上 /
  if (!normalized.startsWith('/') && !normalized.endsWith('/')) {
    normalized = `/${normalized}/`
  }
  return normalized.trim()
}

/**
 * 嘗試不同的單字查詢格式（處理片語、專有名詞等）
 */
function generateQueryVariants(word) {
  const variants = [word] // 原始格式
  
  // 處理片語：嘗試不同的格式
  if (word.includes(' ')) {
    // 空格 -> 連字號
    variants.push(word.replace(/\s+/g, '-'))
    // 空格 -> 下底線
    variants.push(word.replace(/\s+/g, '_'))
    // 移除空格
    variants.push(word.replace(/\s+/g, ''))
  }
  
  // 處理連字號：嘗試移除連字號
  if (word.includes('-')) {
    variants.push(word.replace(/-/g, ' '))
    variants.push(word.replace(/-/g, ''))
  }
  
  // 處理縮寫（如 Mr., Mrs., Ms.）
  if (word.endsWith('.')) {
    variants.push(word.slice(0, -1)) // 移除句點
  }
  
  // 處理複數形式（如 shoe(s), sock(s)）
  if (word.includes('(s)')) {
    variants.push(word.replace(/\(s\)/g, ''))
    variants.push(word.replace(/\(s\)/g, 's'))
  }
  
  // 處理大小寫（專有名詞）
  variants.push(word.toLowerCase())
  variants.push(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  
  // 去重
  return [...new Set(variants)]
}

/**
 * 從字典 API 取得單字資訊（含重試機制和備用 API）
 */
async function lookupWord(word, retryCount = 0, useFallback = false) {
  try {
    const url = `${DICTIONARY_API}/${encodeURIComponent(word)}`
    const response = await axios.get(url, {
      timeout: 5000
    })

    if (!response.data || response.data.length === 0) {
      return null
    }

    const entry = response.data[0]
    
    // 提取音標（優先使用美式發音，否則使用第一個可用的）
    let phonetic = entry.phonetic || ''
    let audioUrl = ''
    
    if (entry.phonetics && entry.phonetics.length > 0) {
      // 優先尋找美式發音（包含 -us.mp3）
      const usPhonetic = entry.phonetics.find(p => 
        p.audio && p.audio.includes('-us.mp3')
      )
      
      if (usPhonetic) {
        phonetic = usPhonetic.text || phonetic
        audioUrl = usPhonetic.audio || ''
      } else {
        // 如果沒有美式發音，使用第一個有音標的
        const phoneticWithText = entry.phonetics.find(p => p.text)
        if (phoneticWithText) {
          phonetic = phoneticWithText.text || phonetic
        }
        
        // 使用第一個有音檔的
        const phoneticWithAudio = entry.phonetics.find(p => p.audio)
        if (phoneticWithAudio) {
          audioUrl = phoneticWithAudio.audio || ''
        }
      }
    }
    
    // 如果沒有 phonetic，嘗試從 phonetics 中取得
    if (!phonetic && entry.phonetics && entry.phonetics.length > 0) {
      phonetic = entry.phonetics[0].text || ''
    }

    // 正規化音標格式
    phonetic = normalizePhonetic(phonetic)

    // 提取詞類（part of speech）
    let partOfSpeech = ''
    if (entry.meanings && entry.meanings.length > 0) {
      partOfSpeech = entry.meanings[0].partOfSpeech || ''
    }

    return {
      phonetic: phonetic.trim(),
      audioUrl: audioUrl.trim(),
      partOfSpeech: partOfSpeech.trim()
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 404 表示找不到單字
      if (error.response?.status === 404) {
        // 如果主要 API 失敗且未使用備用 API，嘗試備用 API
        if (!useFallback && FALLBACK_API_ENABLED) {
          return lookupWordWithFallback(word)
        }
        return null
      }
      
      // 429 表示 API 限流，需要重試
      if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
        const waitTime = (retryCount + 1) * 2000 // 遞增等待時間：2s, 4s, 6s
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return lookupWord(word, retryCount + 1, useFallback)
      }
    }
    
    // 其他錯誤或重試失敗
    // 如果主要 API 失敗且未使用備用 API，嘗試備用 API
    if (!useFallback && FALLBACK_API_ENABLED) {
      return lookupWordWithFallback(word)
    }
    return null
  }
}

/**
 * 使用備用 API 查詢單字
 * 使用不同的查詢策略：嘗試不同的單字格式、大小寫等
 */
async function lookupWordWithFallback(word) {
  if (!FALLBACK_API_ENABLED) {
    return null
  }
  
  // 備用策略：嘗試不同的查詢格式
  const fallbackVariants = []
  
  // 1. 嘗試小寫
  if (word !== word.toLowerCase()) {
    fallbackVariants.push(word.toLowerCase())
  }
  
  // 2. 嘗試首字母大寫
  const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  if (word !== capitalized) {
    fallbackVariants.push(capitalized)
  }
  
  // 3. 對於片語，嘗試不同的格式
  if (word.includes(' ')) {
    // 嘗試連字號格式
    fallbackVariants.push(word.replace(/\s+/g, '-'))
    // 嘗試下底線格式
    fallbackVariants.push(word.replace(/\s+/g, '_'))
  }
  
  // 4. 對於連字號，嘗試空格格式
  if (word.includes('-')) {
    fallbackVariants.push(word.replace(/-/g, ' '))
  }
  
  // 5. 移除標點符號
  const withoutPunctuation = word.replace(/[.,;:!?'"]/g, '')
  if (word !== withoutPunctuation) {
    fallbackVariants.push(withoutPunctuation)
  }
  
  // 去重
  const uniqueVariants = [...new Set(fallbackVariants)]
  
  // 嘗試每個變體
  for (const variant of uniqueVariants) {
    try {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))
      const result = await lookupWord(variant, 0, true) // 使用備用模式，避免無限遞迴
      if (result && (result.phonetic || result.audioUrl || result.partOfSpeech)) {
        return result
      }
    } catch (error) {
      // 忽略錯誤，繼續嘗試下一個變體
      continue
    }
  }
  
  return null
}

/**
 * 查詢單字資訊（嘗試多種格式）
 */
async function lookupWordWithVariants(word) {
  const variants = generateQueryVariants(word)
  
  // 先嘗試原始格式
  for (const variant of variants) {
    const result = await lookupWord(variant, 0, false)
    if (result && (result.phonetic || result.audioUrl || result.partOfSpeech)) {
      return result
    }
    // 延遲以避免 API 限流
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))
  }
  
  return null
}

/**
 * 驗證單字檔案格式
 * 檢查是否有資料錯位、格式錯誤等問題
 */
function validateVocabularyFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split(/\r?\n/)
  const errors = []
  const warnings = []
  const words = []
  let i = 0
  let expectedId = 1
  const foundIds = new Set()
  
  while (i < lines.length) {
    // 尋找序號行（純數字）
    let id = null
    let idLine = i
    while (i < lines.length) {
      const line = lines[i].trim()
      const parsedId = parseInt(line, 10)
      if (!isNaN(parsedId) && parsedId > 0 && line === String(parsedId)) {
        id = parsedId
        idLine = i
        i++ // 跳過序號行
        break
      }
      i++
    }
    
    if (id === null) {
      if (i < lines.length) {
        // 檢查是否還有非空行
        const remainingLines = lines.slice(i).filter(l => l.trim() !== '')
        if (remainingLines.length > 0) {
          errors.push({
            line: i + 1,
            type: 'missing_id',
            message: `第 ${i + 1} 行附近找不到序號，但仍有資料`
          })
        }
      }
      break // 找不到序號，結束
    }
    
    // 檢查序號是否重複
    if (foundIds.has(id)) {
      errors.push({
        line: idLine + 1,
        type: 'duplicate_id',
        message: `序號 ${id} 重複出現（第 ${idLine + 1} 行）`
      })
    } else {
      foundIds.add(id)
    }
    
    // 檢查序號是否連續
    if (id !== expectedId) {
      if (id < expectedId) {
        errors.push({
          line: idLine + 1,
          type: 'id_out_of_order',
          message: `序號 ${id} 出現在預期序號 ${expectedId} 之前（第 ${idLine + 1} 行）`
        })
      } else {
        warnings.push({
          line: idLine + 1,
          type: 'id_skipped',
          message: `序號跳過：預期 ${expectedId}，實際 ${id}（第 ${idLine + 1} 行）`
        })
      }
    }
    expectedId = id + 1
    
    // 跳過空行
    const beforeWordLine = i
    while (i < lines.length && lines[i].trim() === '') {
      i++
    }
    
    // 取得單字（非空行且非純數字）
    let word = null
    let wordLine = i
    if (i < lines.length) {
      const line = lines[i].trim()
      if (line && !/^\d+$/.test(line)) {
        word = line
        wordLine = i
        i++
      } else {
        errors.push({
          line: i + 1,
          type: 'missing_word',
          message: `序號 ${id} 缺少單字（第 ${i + 1} 行應該是單字，但找到：${line || '(空行)'}）`
        })
        i++ // 跳過不符合的行
        continue
      }
    } else {
      errors.push({
        line: beforeWordLine + 1,
        type: 'missing_word',
        message: `序號 ${id} 缺少單字（檔案結束）`
      })
      break
    }
    
    // 跳過空行
    const beforeDefinitionLine = i
    while (i < lines.length && lines[i].trim() === '') {
      i++
    }
    
    // 取得解釋（非空行且非純數字，且不是序號）
    let definition = null
    let definitionLine = i
    if (i < lines.length) {
      const line = lines[i].trim()
      if (line && !/^\d+$/.test(line)) {
        definition = line
        definitionLine = i
        i++
      } else {
        errors.push({
          line: i + 1,
          type: 'missing_definition',
          message: `序號 ${id} 單字 "${word}" 缺少解釋（第 ${i + 1} 行應該是解釋，但找到：${line || '(空行)'}）`
        })
        i++ // 跳過不符合的行
        continue
      }
    } else {
      errors.push({
        line: beforeDefinitionLine + 1,
        type: 'missing_definition',
        message: `序號 ${id} 單字 "${word}" 缺少解釋（檔案結束）`
      })
      break
    }
    
    // 跳過空行（可能有多個空行）
    while (i < lines.length && lines[i].trim() === '') {
      i++
    }
    
    // 儲存資料
    if (id && word && definition) {
      words.push({
        id,
        word,
        definition,
        idLine: idLine + 1,
        wordLine: wordLine + 1,
        definitionLine: definitionLine + 1
      })
    }
  }
  
  // 檢查是否有遺漏的序號
  const maxId = Math.max(...Array.from(foundIds), 0)
  for (let checkId = 1; checkId <= maxId; checkId++) {
    if (!foundIds.has(checkId)) {
      warnings.push({
        line: null,
        type: 'missing_id',
        message: `序號 ${checkId} 遺漏`
      })
    }
  }
  
  return {
    valid: errors.length === 0,
    totalWords: words.length,
    errors,
    warnings,
    words
  }
}

/**
 * 解析單字檔案
 * 格式：每 6 行為一組
 * 1. 序號
 * 2. 空行
 * 3. 單字字彙
 * 4. 空行
 * 5. 單字解釋
 * 6. 空行
 * 
 * 注意：檔案中可能有格式異常（如重複的解釋行），需要處理
 */
function parseVocabularyFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split(/\r?\n/)
  const words = []
  let i = 0
  
  while (i < lines.length) {
    // 尋找序號行（純數字）
    let id = null
    while (i < lines.length) {
      const line = lines[i].trim()
      const parsedId = parseInt(line, 10)
      if (!isNaN(parsedId) && parsedId > 0 && line === String(parsedId)) {
        id = parsedId
        i++ // 跳過序號行
        break
      }
      i++
    }
    
    if (id === null) break // 找不到序號，結束
    
    // 跳過空行
    while (i < lines.length && lines[i].trim() === '') {
      i++
    }
    
    // 取得單字（非空行且非純數字）
    let word = null
    if (i < lines.length) {
      const line = lines[i].trim()
      if (line && !/^\d+$/.test(line)) {
        word = line
        i++
      } else {
        i++ // 跳過不符合的行
        continue
      }
    } else {
      break
    }
    
    // 跳過空行
    while (i < lines.length && lines[i].trim() === '') {
      i++
    }
    
    // 取得解釋（非空行且非純數字，且不是序號）
    let definition = null
    if (i < lines.length) {
      const line = lines[i].trim()
      if (line && !/^\d+$/.test(line)) {
        definition = line
        i++
      } else {
        i++ // 跳過不符合的行
        continue
      }
    } else {
      break
    }
    
    // 跳過空行（可能有多個空行）
    while (i < lines.length && lines[i].trim() === '') {
      i++
    }
    
    // 儲存資料
    if (id && word && definition) {
      words.push({
        id: id,
        word: word,
        definition: definition
      })
    }
  }
  
  return words
}

/**
 * 批次查詢單字資訊（支援增量更新）
 */
async function enrichWords(words, existingData, onProgress) {
  const enriched = []
  let skipped = 0
  let updated = 0
  let added = 0
  
  for (let i = 0; i < words.length; i++) {
    const item = words[i]
    const existing = existingData.get(item.id)
    
    // 檢查是否已存在且資料完整
    if (existing && isDataComplete(existing)) {
      // 資料完整，直接使用現有資料
      enriched.push(existing)
      skipped++
      onProgress?.(i + 1, words.length, item.word, '跳過（資料完整）')
    } else {
      // 資料不完整或不存在，需要查詢
      onProgress?.(i + 1, words.length, item.word, existing ? '更新中...' : '新增中...')
      
      // 使用多種格式查詢單字
      const info = await lookupWordWithVariants(item.word)
      
      const newData = {
        id: item.id,
        word: item.word,
        phonetic: info?.phonetic || '',
        audioUrl: info?.audioUrl || '',
        partOfSpeech: info?.partOfSpeech || '',
        definition: item.definition
      }
      
      // 合併現有資料（保留已有的完整欄位）
      const merged = mergeData(existing, newData)
      enriched.push(merged)
      
      if (existing) {
        updated++
      } else {
        added++
      }
      
      // 延遲以避免 API 限流
      if (i < words.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))
      }
    }
  }
  
  return { enriched, skipped, updated, added }
}

/**
 * 解析現有的 CSV 檔案
 */
function parseExistingCSV(filePath) {
  if (!existsSync(filePath)) {
    return new Map()
  }
  
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split(/\r?\n/)
  const existingData = new Map()
  
  // 跳過標題行（第一行）
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // 解析 CSV 行（處理引號內的逗號）
    const fields = []
    let currentField = ''
    let inQuotes = false
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          // 雙引號轉義
          currentField += '"'
          j++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField)
        currentField = ''
      } else {
        currentField += char
      }
    }
    fields.push(currentField) // 最後一個欄位
    
    if (fields.length >= 6) {
      const id = parseInt(fields[0], 10)
      const word = fields[1]
      const phonetic = fields[2] || ''
      const audioUrl = fields[3] || ''
      const partOfSpeech = fields[4] || ''
      const definition = fields[5] || ''
      
      if (id && word) {
        existingData.set(id, {
          id,
          word,
          phonetic,
          audioUrl,
          partOfSpeech,
          definition
        })
      }
    }
  }
  
  return existingData
}

/**
 * 讀取所有現有資料（包括備份檔案和現有 CSV 檔案）
 * 優先使用備份檔案的資料
 */
function loadAllExistingData(outputFile) {
  const allData = new Map()
  
  // 1. 先讀取備份檔案（如果存在）
  const backupFile = outputFile.replace(/\.csv$/, '.backup.csv')
  if (existsSync(backupFile)) {
    console.log(`讀取備份檔案: ${backupFile}`)
    const backupData = parseExistingCSV(backupFile)
    console.log(`備份檔案資料: ${backupData.size} 個單字`)
    
    // 將備份檔案的資料加入（優先使用）
    for (const [id, data] of backupData) {
      allData.set(id, data)
    }
  }
  
  // 2. 再讀取現有 CSV 檔案（如果存在）
  if (existsSync(outputFile)) {
    console.log(`讀取現有 CSV 檔案: ${outputFile}`)
    const existingData = parseExistingCSV(outputFile)
    console.log(`現有 CSV 檔案資料: ${existingData.size} 個單字`)
    
    // 合併現有 CSV 檔案的資料（只加入備份檔案中沒有的）
    for (const [id, data] of existingData) {
      if (!allData.has(id)) {
        allData.set(id, data)
      }
    }
  }
  
  return allData
}

/**
 * 檢查單字資料是否完整
 */
function isDataComplete(item) {
  return item.phonetic && item.audioUrl && item.partOfSpeech
}

/**
 * 合併資料（保留現有完整資料，更新缺失資料）
 */
function mergeData(existing, newData) {
  if (!existing) {
    return newData
  }
  
  return {
    id: existing.id || newData.id,
    word: existing.word || newData.word,
    phonetic: existing.phonetic || newData.phonetic || '',
    audioUrl: existing.audioUrl || newData.audioUrl || '',
    partOfSpeech: existing.partOfSpeech || newData.partOfSpeech || '',
    definition: existing.definition || newData.definition || ''
  }
}

/**
 * 轉換為 CSV 格式
 */
function convertToCSV(words) {
  // CSV 標題
  const header = 'ID,單字,音標,發音音檔連結,詞類,解釋\n'
  
  // CSV 內容
  const rows = words.map(item => {
    const escapeCSV = (str) => {
      if (!str) return ''
      // 如果包含逗號、引號或換行，需要用引號包圍
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    
    return [
      item.id,
      escapeCSV(item.word),
      escapeCSV(item.phonetic),
      escapeCSV(item.audioUrl),
      escapeCSV(item.partOfSpeech),
      escapeCSV(item.definition)
    ].join(',')
  })
  
  return header + rows.join('\n')
}

/**
 * 檢查檔案格式（不進行轉換）
 */
function checkFile(filePath) {
  console.log(`檢查檔案: ${filePath}\n`)
  
  const result = validateVocabularyFile(filePath)
  
  console.log(`找到 ${result.totalWords} 個單字\n`)
  
  if (result.errors.length > 0) {
    console.log(`❌ 發現 ${result.errors.length} 個錯誤：\n`)
    result.errors.forEach((error, index) => {
      const lineInfo = error.line ? `第 ${error.line} 行` : ''
      console.log(`  ${index + 1}. [${error.type}] ${lineInfo}: ${error.message}`)
    })
    console.log('')
  } else {
    console.log('✅ 未發現錯誤\n')
  }
  
  if (result.warnings.length > 0) {
    console.log(`⚠️  發現 ${result.warnings.length} 個警告：\n`)
    result.warnings.forEach((warning, index) => {
      const lineInfo = warning.line ? `第 ${warning.line} 行` : ''
      console.log(`  ${index + 1}. [${warning.type}] ${lineInfo}: ${warning.message}`)
    })
    console.log('')
  }
  
  // 顯示前幾個單字作為範例
  if (result.words.length > 0) {
    console.log('前 5 個單字範例：\n')
    result.words.slice(0, 5).forEach((item) => {
      console.log(`  ${item.id}. ${item.word} - ${item.definition.substring(0, 30)}...`)
    })
    console.log('')
  }
  
  if (result.valid) {
    console.log('✅ 檔案格式檢查通過，可以進行轉換')
    process.exit(0)
  } else {
    console.log('❌ 檔案格式有錯誤，請先修正後再進行轉換')
    process.exit(1)
  }
}

/**
 * 主函數
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('用法:')
    console.error('  檢查檔案: node convert-vocab-to-csv.js --check <輸入檔案>')
    console.error('  轉換檔案: node convert-vocab-to-csv.js <輸入檔案> [輸出檔案]')
    console.error('')
    console.error('範例:')
    console.error('  node convert-vocab-to-csv.js --check public/data/vocabulary1000.txt')
    console.error('  node convert-vocab-to-csv.js public/data/vocabulary1000.txt public/data/vocabulary1000.csv')
    process.exit(1)
  }
  
  // 檢查模式
  if (args[0] === '--check' || args[0] === '-c') {
    if (args.length < 2) {
      console.error('錯誤: 請指定要檢查的檔案')
      console.error('用法: node convert-vocab-to-csv.js --check <輸入檔案>')
      process.exit(1)
    }
    checkFile(args[1])
    return
  }
  
  const inputFile = args[0]
  const outputFile = args[1] || inputFile.replace(extname(inputFile), '.csv')
  
  try {
    // 先進行格式檢查
    console.log(`檢查檔案格式: ${inputFile}`)
    const validation = validateVocabularyFile(inputFile)
    
    if (!validation.valid) {
      console.error('\n❌ 檔案格式檢查失敗，發現以下錯誤：\n')
      validation.errors.forEach((error, index) => {
        const lineInfo = error.line ? `第 ${error.line} 行` : ''
        console.error(`  ${index + 1}. [${error.type}] ${lineInfo}: ${error.message}`)
      })
      if (validation.warnings.length > 0) {
        console.error('\n⚠️  警告：\n')
        validation.warnings.forEach((warning, index) => {
          const lineInfo = warning.line ? `第 ${warning.line} 行` : ''
          console.error(`  ${index + 1}. [${warning.type}] ${lineInfo}: ${warning.message}`)
        })
      }
      console.error('\n請先修正錯誤後再進行轉換')
      process.exit(1)
    }
    
    if (validation.warnings.length > 0) {
      console.log('\n⚠️  發現以下警告：\n')
      validation.warnings.forEach((warning, index) => {
        const lineInfo = warning.line ? `第 ${warning.line} 行` : ''
        console.log(`  ${index + 1}. [${warning.type}] ${lineInfo}: ${warning.message}`)
      })
      console.log('')
    }
    
    console.log(`✅ 檔案格式檢查通過，找到 ${validation.totalWords} 個單字\n`)
    
    // 解析檔案
    console.log(`解析檔案: ${inputFile}`)
    const words = parseVocabularyFile(inputFile)
    console.log(`解析完成，共 ${words.length} 個單字\n`)
    
    // 讀取所有現有資料（包括備份檔案和現有 CSV 檔案）
    const existingData = loadAllExistingData(outputFile)
    if (existingData.size > 0) {
      console.log(`合併後現有資料: ${existingData.size} 個單字\n`)
    } else {
      console.log('未找到現有資料檔案，將建立新檔案\n')
    }
    
    console.log('\n開始從網路搜尋單字資訊（音標、發音、詞類）...')
    console.log('已完整的單字將跳過，只更新不完整的資料...\n')
    
    const { enriched, skipped, updated, added } = await enrichWords(
      words,
      existingData,
      (current, total, word, status) => {
        const percent = Math.round((current / total) * 100)
        process.stdout.write(`\r進度: ${current}/${total} (${percent}%) - ${word} [${status}]        `)
      }
    )
    
    console.log('\n\n轉換為 CSV 格式...')
    const csvContent = convertToCSV(enriched)
    writeFileSync(outputFile, csvContent, 'utf-8')
    
    // 統計資訊
    const withPhonetic = enriched.filter(w => w.phonetic).length
    const withAudio = enriched.filter(w => w.audioUrl).length
    const withPartOfSpeech = enriched.filter(w => w.partOfSpeech).length
    const complete = enriched.filter(w => isDataComplete(w)).length
    
    console.log(`\n✅ 轉換完成: ${outputFile}`)
    console.log(`\n處理統計:`)
    console.log(`  - 跳過（資料完整）: ${skipped}`)
    console.log(`  - 更新（資料不完整）: ${updated}`)
    console.log(`  - 新增: ${added}`)
    console.log(`\n資料完整性統計:`)
    console.log(`  - 總單字數: ${enriched.length}`)
    console.log(`  - 完整資料: ${complete} (${Math.round(complete/enriched.length*100)}%)`)
    console.log(`  - 有音標: ${withPhonetic} (${Math.round(withPhonetic/enriched.length*100)}%)`)
    console.log(`  - 有發音音檔: ${withAudio} (${Math.round(withAudio/enriched.length*100)}%)`)
    console.log(`  - 有詞類: ${withPartOfSpeech} (${Math.round(withPartOfSpeech/enriched.length*100)}%)`)
  } catch (error) {
    console.error('\n❌ 轉換失敗:', error.message)
    process.exit(1)
  }
}

main()
