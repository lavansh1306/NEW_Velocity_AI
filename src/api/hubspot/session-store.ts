/**
 * Production-grade session store for serverless environments
 * STRATEGY: PRIMARY = In-Memory (required for Vercel), FALLBACK = /tmp (optional)
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

interface SessionData {
  userId?: string;
  portalId?: string;
  storeKey?: string;
  codeVerifier?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  createdAt: number;
}

class SessionStore {
  private storePath: string;
  private isLocal: boolean;
  // PRIMARY STORE: Memory is always available, even in serverless
  private memoryStore: Map<string, SessionData> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.isLocal = process.env.NODE_ENV !== 'production';
    
    if (!this.isLocal) {
      this.storePath = '/tmp/hubspot-sessions';
      // Non-blocking directory creation
      this.ensureDirectory().catch(() => {
        console.warn('[SessionStore] /tmp unavailable, using memory only');
      });
    }
    
    this.startCleanupTimer();
    console.log('[SessionStore] Initialized with memory-first strategy');
  }

  private async ensureDirectory(): Promise<void> {
    if (this.isLocal) return;
    try {
      await mkdir(this.storePath, { recursive: true });
    } catch (err: any) {
      if (err.code !== 'EEXIST') throw err;
    }
  }

  private getFilePath(sessionId: string): string {
    return path.join(this.storePath, `${sessionId}.json`);
  }

  async set(sessionId: string, data: SessionData): Promise<void> {
    const sessionData: SessionData = {
      ...data,
      createdAt: data.createdAt || Date.now(),
    };

    // ALWAYS store in memory (PRIMARY - this NEVER fails)
    this.memoryStore.set(sessionId, sessionData);
    console.log(`[SessionStore] Memory: ${sessionId}`);

    // Try /tmp backup (non-blocking, non-critical)
    if (!this.isLocal) {
      setImmediate(async () => {
        try {
          await writeFile(
            this.getFilePath(sessionId),
            JSON.stringify(sessionData),
            'utf-8'
          );
        } catch (err) {
          // Silently fail - memory store is what matters
        }
      });
    }
  }

  async get(sessionId: string): Promise<SessionData | null> {
    // Always check memory FIRST (fastest, always available)
    const memoryData = this.memoryStore.get(sessionId);
    if (memoryData) {
      console.log(`[SessionStore] Hit (memory): ${sessionId}`);
      return memoryData;
    }

    // Fallback to /tmp if available
    if (!this.isLocal) {
      try {
        const content = await readFile(this.getFilePath(sessionId), 'utf-8');
        const data = JSON.parse(content) as SessionData;
        // Restore to memory
        this.memoryStore.set(sessionId, data);
        console.log(`[SessionStore] Hit (/tmp): ${sessionId}`);
        return data;
      } catch (err) {
        // File not found or parse error - that's OK
      }
    }

    console.log(`[SessionStore] Miss: ${sessionId}`);
    return null;
  }

  async delete(sessionId: string): Promise<void> {
    this.memoryStore.delete(sessionId);
    
    if (!this.isLocal) {
      try {
        await unlink(this.getFilePath(sessionId));
      } catch (err) {
        // Ignore delete errors
      }
    }
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000;

    // Clean memory
    for (const [sessionId, data] of this.memoryStore.entries()) {
      if (now - data.createdAt > maxAge) {
        this.memoryStore.delete(sessionId);
      }
    }
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  destroy(): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }
}

export const sessionStore = new SessionStore();
