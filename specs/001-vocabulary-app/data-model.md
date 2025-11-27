# Data Model: 背單字軟體

All entities originate from the specification’s Key Entities section, expanded with technical attributes needed for IndexedDB persistence and offline sync.

## Entity: Word
| Field | Type | Description | Validation / Notes |
| --- | --- | --- | --- |
| `id` | string (ULID) | Primary identifier | Generated client-side; collision-resistant |
| `lemma` | string | Raw word from CSV or manual entry | Required, trimmed, 2–64 chars |
| `phonetics` | string[] | IPA strings returned by dictionary API | Optional; empty array allowed |
| `audioUrls` | string[] | Cached pronunciation URLs or blob IDs | Optional; each entry validated as HTTPS or IndexedDB blob |
| `partOfSpeech` | string | Noun/verb/etc. | Required for manual entry; enum from dictionary payload |
| `definitionEn` | string | English definition | Optional; can be empty for manual entries |
| `definitionZh` | string | Chinese definition | Required for manual entry |
| `examples` | string[] | Example sentences | Optional; max 5 stored |
| `synonyms` | string[] | Synonym list | Optional |
| `antonyms` | string[] | Antonym list | Optional |
| `status` | enum (`unlearned`,`learning`,`mastered`) | Study progression | Defaults to `unlearned` |
| `needsReview` | boolean | Review flag | Derived from spaced-repetition engine |
| `lastStudiedAt` | ISO datetime | Timestamp of latest interaction | Optional; null for untouched words |
| `reviewDueAt` | ISO datetime | Next recommended review time | Nullable |
| `notes` | string | User note snippet | Optional, 0–500 chars |
| `source` | enum (`csv`,`manual`) | Origin of the word | Set at creation |
| `infoCompleteness` | enum (`complete`,`missing-definition`,`missing-audio`) | Tracks enrichment success | Drives UI badges |
| `tags` | string[] | Tag IDs | Many-to-many via Tag entity |
| `setIds` | string[] | WordSet IDs | Enables multi-set membership |

## Entity: WordSet
| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Primary key |
| `name` | string | Display name (e.g., “TOEIC Core”) |
| `description` | string | Optional |
| `createdAt` | ISO datetime | Auditing |
| `wordIds` | string[] | Words in the set |
| `colorToken` | string | Vuetify theme token for chips |

## Entity: Tag
| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Primary key |
| `label` | string | User-facing label |
| `color` | string | HEX token used in UI |
| `wordCount` | number | Denormalized count for quick filters |

## Entity: Note
| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Note identifier |
| `wordId` | string | FK → Word |
| `content` | string | Markdown-friendly content |
| `createdAt` | ISO datetime | Timestamp |
| `updatedAt` | ISO datetime | Timestamp |

## Entity: LearningSession
| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Session identifier |
| `type` | enum (`study`,`review`) | Session category |
| `wordIds` | string[] | Words practiced |
| `startedAt` | ISO datetime | Start |
| `endedAt` | ISO datetime | End |
| `durationMs` | number | Derived duration |
| `actions` | array | Sequence of user actions for analytics |

## Entity: Quiz
| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Quiz identifier |
| `mode` | enum (`multiple-choice`,`fill-in`,`spell`) | Quiz type |
| `createdAt` | ISO datetime | Timestamp |
| `questionIds` | string[] | FK → QuizQuestion |
| `scorePercent` | number | Calculated on completion |

## Entity: QuizQuestion
| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Question identifier |
| `quizId` | string | FK → Quiz |
| `prompt` | string | Displayed content |
| `choices` | string[] | For MCQ |
| `correctAnswer` | string | Canonical answer |
| `userAnswer` | string | Actual response |
| `isCorrect` | boolean | Derived |

## Entity: UserProgress
| Field | Type | Description |
| --- | --- | --- |
| `id` | string (`singleton`) | Always `progress` |
| `totalWords` | number | Word count |
| `masteredWords` | number | Derived |
| `streakDays` | number | Consecutive active days |
| `totalStudyMinutes` | number | Aggregated duration |
| `lastActivityAt` | ISO datetime | Last interaction |
| `heatmap` | Record<date, minutes> | Calendar heatmap source |

## Entity: ImportJob
| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Job identifier |
| `filename` | string | Original CSV file name |
| `totalWords` | number | Count parsed |
| `processedWords` | number | Completed enrichment count |
| `status` | enum (`pending`,`running`,`failed`,`completed`) | Progress tracking |
| `errors` | {row:number,message:string}[] | Parsing/enrichment issues |
| `startedAt` / `endedAt` | ISO datetime | Auditing |

## Relationships
- Word ↔ WordSet: many-to-many via `setIds`.
- Word ↔ Tag: many-to-many via `tags`.
- Word ↔ Note: one-to-many.
- Word ↔ QuizQuestion: implicit through quiz generation history.
- LearningSession references Word IDs but does not duplicate word data.
- ImportJob produces Word entities and updates UserProgress totals upon completion.

