# API Contract: Vocabulary Local Services

These endpoints describe the internal HTTP-like contract exposed by the service worker/local API layer so that UI components and automated tests can reason about deterministic inputs/outputs (even though all data persists in IndexedDB).

> **Base URL**: `app://local/api`
>
> **Auth**: none (single-user PWA)

## Common Schemas
- `WordStatus` = `unlearned | learning | mastered`
- `ImportStatus` = `pending | running | failed | completed`
- Error envelope:
```json
{ "error": { "code": "string", "message": "string", "details": object } }
```

## 1. GET `/words`
Returns paginated words with filters.

**Query params**
- `q` (optional): substring search across lemma/definitions
- `status`, `needsReview`, `tag`, `setId`
- `limit` (default 50, max 200), `cursor`

**200 Response**
```json
{
  "items": [ { "id": "w_01H...", "lemma": "abandon", "definitionEn": "...", "definitionZh": "...", "status": "learning", "needsReview": true } ],
  "nextCursor": "opaque-string-or-null"
}
```

## 2. POST `/words`
Creates a manual word entry (bypasses CSV flow).

**Request**
```json
{
  "lemma": "serendipity",
  "phonetics": ["/ˌserənˈdɪpəti/"],
  "audioUrls": ["https://..."],
  "partOfSpeech": "noun",
  "definitionZh": "意外發現心喜之物",
  "definitionEn": "the occurrence ...",
  "examples": ["..."],
  "notes": "GRE list",
  "tags": ["difficult"]
}
```

**Required Fields**: `lemma`, `partOfSpeech`, `definitionZh`
**Optional Fields**: `phonetics`, `audioUrls`, `definitionEn`, `examples`, `notes`, `tags`

**Responses**
- `201` with created Word payload
- `422` if mandatory fields missing

## 3. PATCH `/words/{id}`
Updates word metadata (status, tags, notes, definitions, completeness flags).

## 4. DELETE `/words/{id}`
Removes a word and cascades Tag counts / WordSet membership.

## 5. POST `/import-jobs`
Starts a CSV import job.

**Request**
```json
{
  "filename": "toeic.csv",
  "words": ["abandon","ability","able"]
}
```

**Response**
```json
{
  "jobId": "job_01H...",
  "status": "pending",
  "totalWords": 3
}
```

## 6. GET `/import-jobs/{id}`
Returns job progress (processed count, errors, timestamps).

## 7. POST `/import-jobs/{id}/retry`
Retries dictionary enrichment for failed words.

## 8. POST `/dictionary/enrich`
Batch endpoint used by worker to fetch data for up to 25 words per call.

**Request**
```json
{ "words": ["abandon","abate"] }
```

**200 Response**
```json
{
  "results": [
    {
      "lemma": "abandon",
      "definitionEn": "...",
      "definitionZh": "...",
      "phonetics": ["əˈbændən"],
      "audioUrl": "https://api.dictionaryapi.dev/media/...",
      "source": "dictionaryapi.dev"
    }
  ],
  "notFound": ["abate"]
}
```

## 9. POST `/words/{id}/status`
Updates study/review markers.

**Request**
```json
{
  "status": "mastered",
  "needsReview": false,
  "reviewDueAt": null
}
```

## 10. POST `/quizzes`
Generates a quiz from current word pool.

**Request**
```json
{
  "mode": "multiple-choice",
  "wordIds": ["w1","w2","w3","w4","w5"]
}
```

**Response**
```json
{
  "quizId": "quiz_01H...",
  "questions": [
    {
      "id": "qq_01H...",
      "prompt": "中文：意外發現心喜之物",
      "choices": ["serendipity","abandon","benevolent","tenacious"],
      "correctAnswer": "serendipity"
    }
  ]
}
```

## 11. POST `/quizzes/{id}/submit`
Accepts user answers, calculates score, records metrics used by progress dashboard.

## 12. GET `/progress/summary`
Returns aggregates for dashboards (total words, mastered count, streak, heatmap data).

## 13. GET `/reports/activity?range=30d`
Provides session-based analytics for trends and heatmap visualizations.

These contracts are implemented by local repositories/service workers but surfaced over a consistent HTTP-like interface so that Playwright tests and potential future native shells can reuse the same abstractions.

