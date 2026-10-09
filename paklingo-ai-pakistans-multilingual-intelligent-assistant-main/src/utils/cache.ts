/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Lightweight in-memory LRU client cache with TTL
export class MemoryCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();
  private maxEntries: number;
  private defaultTtlMs: number;

  constructor(maxEntries = 100, defaultTtlMs = 30 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh LRU order
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.store.clear();
  }
}

// Global module-level caches for instant responses
export const translationClientCache = new MemoryCache<{
  translatedText: string;
  romanTransliteration?: string;
  notes?: string;
}>(150);

export const governmentQueryCache = new MemoryCache<any>(100);
export const teacherQueryCache = new MemoryCache<any>(100);
export const medicalQueryCache = new MemoryCache<any>(100);
export const farmerQueryCache = new MemoryCache<any>(100);
export const legalQueryCache = new MemoryCache<any>(100);
