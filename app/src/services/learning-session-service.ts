import { initDB } from './db'
import type { LearningSession, LearningSessionType, SessionAction } from '@/types/learning-session'
import { createLearningSession } from '@/types/learning-session'
import { logger } from '@/utils/logger'

export class LearningSessionService {
  private dbPromise = initDB()

  /**
   * Create a new learning session
   */
  async createSession(type: LearningSessionType, wordIds: string[] = []): Promise<LearningSession> {
    const session = createLearningSession(type, wordIds)
    const db = await this.dbPromise
    await db.add('learningSessions', session)
    
    logger.info(`Created ${type} session`, {
      sessionId: session.id,
      wordCount: wordIds.length
    })

    return session
  }

  /**
   * Get session by ID
   */
  async getById(id: string): Promise<LearningSession | undefined> {
    const db = await this.dbPromise
    return db.get('learningSessions', id)
  }

  /**
   * Update session
   */
  async update(session: LearningSession): Promise<void> {
    const db = await this.dbPromise
    await db.put('learningSessions', session)
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.getById(sessionId)
    if (!session) {
      throw new Error(`Session with id ${sessionId} not found`)
    }

    const now = new Date().toISOString()
    const startedAt = new Date(session.startedAt)
    const endedAt = new Date(now)
    const durationMs = endedAt.getTime() - startedAt.getTime()

    session.endedAt = now
    session.durationMs = durationMs

    await this.update(session)

    logger.info(`Ended session ${sessionId}`, {
      durationMs,
      actionCount: session.actions.length
    })
  }

  /**
   * Add an action to a session
   */
  async addAction(
    sessionId: string,
    action: Omit<SessionAction, 'timestamp'>
  ): Promise<void> {
    const session = await this.getById(sessionId)
    if (!session) {
      throw new Error(`Session with id ${sessionId} not found`)
    }

    const sessionAction: SessionAction = {
      ...action,
      timestamp: new Date().toISOString()
    }

    session.actions.push(sessionAction)
    await this.update(session)

    logger.debug(`Added action to session ${sessionId}`, {
      actionType: action.type
    })
  }

  /**
   * Get all sessions
   */
  async getAll(): Promise<LearningSession[]> {
    const db = await this.dbPromise
    return db.getAll('learningSessions')
  }

  /**
   * Get sessions by type
   */
  async getByType(type: LearningSessionType): Promise<LearningSession[]> {
    const all = await this.getAll()
    return all.filter(s => s.type === type)
  }

  /**
   * Get active (not ended) sessions
   */
  async getActiveSessions(): Promise<LearningSession[]> {
    const all = await this.getAll()
    return all.filter(s => s.endedAt === null)
  }

  /**
   * Delete session
   */
  async delete(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete('learningSessions', id)
  }
}

export const learningSessionService = new LearningSessionService()

