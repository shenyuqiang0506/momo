import axios from 'axios';

// Rate limiting: 18 requests per 10 seconds
const REQUEST_LIMIT = 18;
const TIME_WINDOW = 10000; // 10 seconds
const requestTimes: number[] = [];

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  // Remove requests older than the time window
  const recentRequests = requestTimes.filter(time => now - time < TIME_WINDOW);

  if (recentRequests.length >= REQUEST_LIMIT) {
    const oldestRequest = recentRequests[0];
    const waitTime = TIME_WINDOW - (now - oldestRequest);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  requestTimes.push(Date.now());
}

async function maimemoRequest<T>(
  path: string,
  token: string,
  options?: {
    method?: 'GET' | 'POST';
    body?: any;
  }
): Promise<T> {
  await waitForRateLimit();

  // Always use Vercel proxy for CORS handling
  const url = `/api/maimemo/${path}`;

  try {
    const response = await axios({
      url,
      method: options?.method || 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: options?.body,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Maimemo API error: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

export interface StudyProgress {
  finished: number;
  total: number;
  time_minutes: number;
}

export interface TodayItem {
  voc_id: number;
  spelling: string;
  // Add other fields as needed
}

export interface WordIdMap {
  [spelling: string]: number;
}

export interface NotepadResponse {
  notepad_id: string;
  // Add other fields as needed
}

export interface InterpretationResponse {
  interpretation_id: string;
  // Add other fields as needed
}

export interface NoteResponse {
  note_id: string;
  // Add other fields as needed
}

export const maimemoAPI = {
  async getStudyProgress(token: string): Promise<StudyProgress> {
    return await maimemoRequest<StudyProgress>('api/v1/memo/study/get_study_progress', token);
  },

  async getTodayItems(token: string, limit: number = 50): Promise<TodayItem[]> {
    return await maimemoRequest<TodayItem[]>(
      `api/v1/memo/study/get_today_items?limit=${limit}`,
      token
    );
  },

  async addWords(token: string, wordIds: number[], advance: boolean = false): Promise<any> {
    return await maimemoRequest('api/v1/memo/study/add_words', token, {
      method: 'POST',
      body: {
        voc_ids: wordIds,
        advance,
      },
    });
  },

  async advanceStudy(token: string, vocIds: number[]): Promise<any> {
    return await maimemoRequest('api/v1/memo/study/advance_study', token, {
      method: 'POST',
      body: {
        voc_ids: vocIds,
      },
    });
  },

  async queryWordIds(token: string, spellings: string[]): Promise<WordIdMap> {
    const BATCH_SIZE = 1000;
    const result: WordIdMap = {};

    for (let i = 0; i < spellings.length; i += BATCH_SIZE) {
      const batch = spellings.slice(i, i + BATCH_SIZE);
      const batchResult = await maimemoRequest<WordIdMap>(
        'api/v1/memo/vocabulary/query_word_ids',
        token,
        {
          method: 'POST',
          body: {
            spellings: batch,
          },
        }
      );
      Object.assign(result, batchResult);
    }

    return result;
  },

  async createNotepad(
    token: string,
    title: string,
    content: string,
    tags: string[] = []
  ): Promise<NotepadResponse> {
    return await maimemoRequest('api/v1/memo/notepad/create', token, {
      method: 'POST',
      body: {
        title,
        content,
        tags,
      },
    });
  },

  async createInterpretation(
    token: string,
    vocId: number,
    interpretation: string,
    tags: string[] = []
  ): Promise<InterpretationResponse> {
    return await maimemoRequest('api/v1/memo/interpretation/create', token, {
      method: 'POST',
      body: {
        voc_id: vocId,
        interpretation,
        tags,
      },
    });
  },

  async createNote(
    token: string,
    vocId: number,
    noteType: string,
    note: string
  ): Promise<NoteResponse> {
    return await maimemoRequest('api/v1/memo/note/create', token, {
      method: 'POST',
      body: {
        voc_id: vocId,
        note_type: noteType,
        note,
      },
    });
  },
};
