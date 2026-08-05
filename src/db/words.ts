import { db } from './index';
import type { Word } from '../types/index';

export const wordDB = {
  async bulkCreate(words: Omit<Word, 'id'>[]): Promise<number[]> {
    return await db.words.bulkAdd(words);
  },

  async list(options?: {
    search?: string;
    category?: string;
    isSynced?: boolean;
    sortBy?: 'frequency' | 'spelling' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<Word[]> {
    let query = db.words.toCollection();

    if (options?.search) {
      query = query.filter(word =>
        word.spelling.toLowerCase().includes(options.search!.toLowerCase())
      );
    }

    if (options?.category) {
      query = query.filter(word => word.category === options.category);
    }

    if (options?.isSynced !== undefined) {
      query = query.filter(word => word.isSynced === options.isSynced);
    }

    let result = await query.toArray();

    if (options?.sortBy === 'frequency') {
      result.sort((a, b) =>
        options.sortOrder === 'asc'
          ? a.frequency - b.frequency
          : b.frequency - a.frequency
      );
    } else if (options?.sortBy === 'spelling') {
      result.sort((a, b) =>
        options.sortOrder === 'asc'
          ? a.spelling.localeCompare(b.spelling)
          : b.spelling.localeCompare(a.spelling)
      );
    } else if (options?.sortBy === 'createdAt') {
      result.sort((a, b) =>
        options.sortOrder === 'asc'
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime()
      );
    }

    if (options?.offset) {
      result = result.slice(options.offset);
    }

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  },

  async update(id: number, updates: Partial<Word>): Promise<void> {
    await db.words.update(id, updates);
  },

  async bulkUpdateSelected(ids: number[], isSelected: boolean): Promise<void> {
    await db.words.where('id').anyOf(ids).modify({ isSelected });
  },

  async bulkMarkSynced(ids: number[]): Promise<void> {
    await db.words.where('id').anyOf(ids).modify({ isSynced: true });
  },

  async stats(): Promise<{
    total: number;
    synced: number;
    pending: number;
  }> {
    const total = await db.words.count();
    const allWords = await db.words.toArray();
    const synced = allWords.filter(w => w.isSynced === true).length;
    const pending = total - synced;
    return { total, synced, pending };
  },

  async getSelectedWords(): Promise<Word[]> {
    return await db.words.where('isSelected').equals(true).toArray();
  },

  async getByArticleId(articleId: number): Promise<Word[]> {
    return await db.words.where('articleId').equals(articleId).toArray();
  },

  async delete(ids: number[]): Promise<void> {
    await db.words.where('id').anyOf(ids).delete();
  },
};
