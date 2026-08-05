import { db } from './index';
import type { SyncLog } from '../types/index';

export const syncLogDB = {
  async create(log: Omit<SyncLog, 'id'>): Promise<number> {
    return await db.syncLogs.add(log);
  },

  async list(options?: {
    limit?: number;
    offset?: number;
  }): Promise<SyncLog[]> {
    let query = db.syncLogs.orderBy('createdAt').reverse();

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return await query.toArray();
  },
};
