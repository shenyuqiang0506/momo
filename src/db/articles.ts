import { db } from './index';
import type { Article } from '../types/index';

export const articleDB = {
  async create(article: Omit<Article, 'id'>): Promise<number> {
    return await db.articles.add(article);
  },

  async getById(id: number): Promise<Article | undefined> {
    return await db.articles.get(id);
  },

  async list(options?: {
    limit?: number;
    offset?: number;
    batchName?: string;
    status?: string;
  }): Promise<Article[]> {
    let query = db.articles.orderBy('createdAt').reverse();

    if (options?.batchName) {
      query = query.filter(article => article.batchName === options.batchName);
    }

    if (options?.status) {
      query = query.filter(article => article.status === options.status);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return await query.toArray();
  },

  async update(id: number, updates: Partial<Article>): Promise<void> {
    await db.articles.update(id, updates);
  },

  async delete(id: number): Promise<void> {
    await db.transaction('rw', [db.articles, db.words], async () => {
      await db.words.where('articleId').equals(id).delete();
      await db.articles.delete(id);
    });
  },

  async getByHash(contentHash: string): Promise<Article | undefined> {
    return await db.articles.where('contentHash').equals(contentHash).first();
  },
};
