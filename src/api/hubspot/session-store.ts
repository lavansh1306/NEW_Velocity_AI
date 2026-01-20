/**
 * Production-grade session store for serverless environments
 * Uses file-based storage for Vercel, falls back to memory for local dev
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

interface Store {
  [sessionId: string]: SessionData;
}

class SessionStore {
  private storePath: string;
  private isLocal: boolean;
  private memoryStore: Map<string, SessionData> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.isLocal = process.env.NODE_ENV !== 'production';
    
    if (!this.isLocal) {
      // Use /tmp for Vercel (persistent within function lifecycle)
      this.storePath = '/tmp/hubspot-sessions';
      this.ensureDirectory();
    }
    
    // Clean up expired sessions every 5 minutes
    this.startCleanupTimer();
  }

  private async ensureDirectory(): Promise<void> {
    if (this.isLocal) return;
    try {
      await mkdir(this.storePath, { recursive: true });
    } catch (err: any) {
      if (err.code !== 'EEXIST') {
        console.error('[SessionStore] Failed to create directory:', err);
      }
    }
  }

  private getFilePath(sessionId: string): string {
    return path.join(this.storePath, `${sessionId}.json`);
  }

  async set(sessionId: string, data: SessionData): Promise<void> {
    try {
      const sessionData: SessionData = {
        ...data,
        createdAt: data.createdAt || Date.now(),
      };

      if (this.isLocal) {
        // Local: use memory store
        this.memoryStore.set(sessionId, sessionData);
        console.log(`[SessionStore] Local: Saved session ${sessionId}`);
      } else {
        // Production: persist to file
        await writeFile(
          this.getFilePath(sessionId),
          JSON.stringify(sessionData, null, 2),
          'utf-8'
        );
        console.log(`[SessionStore] Production: Persisted session ${sessionId} to /tmp`);
      }
    } catch (err) {
      console.error(`[SessionStore] Failed to save session ${sessionId}:`, err);
      throw err;
    }
  }

  async get(sessionId: string): Promise<SessionData | null> {
    try {
      if (this.isLocal) {
        // Local: get from memory
        const data = this.memoryStore.get(sessionId) || null;
        if (data) {
          console.log(`[SessionStore] Local: Retrieved session ${sessionId}`);
        }
        return data;
      } else {
        // Production: read from file
        const filePath = this.getFilePath(sessionId);
        try {
          const content = await readFile(filePath, 'utf-8');
          const data = JSON.parse(content) as SessionData;
          console.log(`[SessionStore] Production: Retrieved session ${sessionId} from /tmp`);
          return data;
        } catch (err: any) {
          if (err.code === 'ENOENT') {
            console.log(`[SessionStore] Session ${sessionId} not found`);
            return null;
          }
          throw err;
        }
      }
    } catch (err) {
      console.error(`[SessionStore] Failed to retrieve session ${sessionId}:`, err);
      return null;
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      if (this.isLocal) {
        this.memoryStore.delete(sessionId);
        console.log(`[SessionStore] Local: Deleted session ${sessionId}`);
      } else {
        try {
          await unlink(this.getFilePath(sessionId));
          console.log(`[SessionStore] Production: Deleted session ${sessionId} from /tmp`);
        } catch (err: any) {
          if (err.code !== 'ENOENT') {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error(`[SessionStore] Failed to delete session ${sessionId}:`, err);
    }
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    if (this.isLocal) {
      // Clean up memory store
      for (const [sessionId, data] of this.memoryStore.entries()) {
        if (now - data.createdAt > maxAge) {
          this.memoryStore.delete(sessionId);
          console.log(`[SessionStore] Cleaned up expired session ${sessionId}`);
        }
      }
    } else {
      // Clean up files in /tmp
      try {
        const files = fs.readdirSync(this.storePath);
        for (const file of files) {
          const filePath = path.join(this.storePath, file);
          const stat = fs.statSync(filePath);
          if (now - stat.mtime.getTime() > maxAge) {
            await unlink(filePath);
            console.log(`[SessionStore] Cleaned up expired file ${file}`);
          }
        }
      } catch (err) {
        console.error('[SessionStore] Error during cleanup:', err);
      }
    }
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const sessionStore = new SessionStore();
