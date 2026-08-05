export type SourceType = 'pdf' | 'txt' | 'paste';
export type ArticleStatus = 'uploaded' | 'analyzing' | 'analyzed' | 'synced';
export type WordCategory = 'high_frequency' | 'synonym';
export type SyncType = 'full' | 'notepad' | 'interpretation' | 'note' | 'plan';

export interface Article {
  id?: number;
  title: string;
  sourceType: SourceType;
  contentHash: string;
  batchName: string;
  charCount: number;
  status: ArticleStatus;
  notepadId?: string;
  createdAt: Date;
}

export interface Word {
  id?: number;
  articleId: number;
  spelling: string;
  maimemoVocId?: number;
  interpretation?: string;
  note?: string;
  category: WordCategory;
  synonymGroupId?: string;
  synonymMeaning?: string;
  frequency: number;
  isSelected: boolean;
  isSynced: boolean;
  createdAt: Date;
}

export interface SyncLog {
  id?: number;
  syncType: SyncType;
  wordCount: number;
  successCount: number;
  failCount: number;
  notepadId?: string;
  createdAt: Date;
}
