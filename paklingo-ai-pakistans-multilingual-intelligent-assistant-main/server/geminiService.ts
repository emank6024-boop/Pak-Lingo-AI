import { GoogleGenAI } from '@google/genai';

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Helper to prevent hanging API calls
export function callGeminiWithTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini call timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

// In-memory High-Performance Server Cache with LRU eviction and TTL
export class ServerLRUCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  constructor(private maxEntries = 400, private defaultTtlMs = 60 * 60 * 1000) {}

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, expiry: Date.now() + ttlMs });
  }
}

// Resilient priority order: fastest low-latency models first (gemini-3.1-flash-lite)
export const CANDIDATE_GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
];

export function isQuotaExhaustedError(err: any): boolean {
  if (!err) return false;
  if (err.status === 429) return true;
  const msg = typeof err.message === 'string' ? err.message : JSON.stringify(err);
  return msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
}

// Resilient candidate model execution with instant failover
export async function callWithCandidateModels<T>(
  actionName: string,
  operation: (modelName: string) => Promise<T>,
  timeoutMs = 12000
): Promise<T> {
  let lastError: any = null;

  for (const modelName of CANDIDATE_GEMINI_MODELS) {
    try {
      const result = await callGeminiWithTimeout(operation(modelName), timeoutMs);
      if (result) {
        return result;
      }
    } catch (err: any) {
      lastError = err;
      // Immediately failover to next candidate model with zero blocking delay
    }
  }

  console.error(`[AI Model Failure] All candidate models failed for ${actionName}:`, lastError?.message || lastError);
  throw lastError || new Error(`All candidate models failed for ${actionName}`);
}
