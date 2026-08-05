import Dexie from 'dexie';
import type { Article, Word, SyncLog } from '../types/index';

export class VocabAssistantDB extends Dexie {
  articles!: Dexie.Table<Article>;
  words!: Dexie.Table<Word>;
  syncLogs!: Dexie.Table<SyncLog>;

  constructor() {
    super('VocabAssistant');
    this.version(1).stores({
      articles: '++id, contentHash, batchName, status, createdAt',
      words: '++id, articleId, spelling, category, synonymGroupId, isSelected, isSynced, frequency',
      syncLogs: '++id, createdAt',
    });
  }
}

export const db = new VocabAssistantDB();

export { articleDB } from './articles';
export { wordDB } from './words';
export { syncLogDB } from './syncLogs';
