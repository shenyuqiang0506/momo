import axios from 'axios';

export interface HighFreqWord {
  spelling: string;
  interpretation: string;
  note: string;
  importance: number;
}

export interface SynonymPair {
  words: string[];
  meaning: string;
  note: string;
  interpretations: string[];
}

export type { HighFreqWord, SynonymPair };

const MAX_CONTENT_LENGTH = 15000;

function truncateContent(content: string): string {
  if (content.length <= MAX_CONTENT_LENGTH) {
    return content;
  }
  return content.slice(0, MAX_CONTENT_LENGTH);
}

async function aiRequest<T>(
  apiKey: string,
  baseUrl: string,
  model: string,
  messages: any[]
): Promise<T> {
  try {
    // Always use Vercel proxy for CORS handling
    const url = '/api/ai/completions';

    const response = await axios(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        baseUrl,
        apiKey,
        model,
        messages,
        temperature: 0.7,
      },
    });

    const content = response.data.choices[0].message.content;
    return JSON.parse(content) as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`AI API error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

export const aiAPI = {
  async extractHighFreqWords(
    apiKey: string,
    baseUrl: string,
    model: string,
    content: string
  ): Promise<HighFreqWord[]> {
    const truncatedContent = truncateContent(content);

    const messages = [
      {
        role: 'system',
        content: 'You are an expert in English vocabulary for Chinese graduate entrance exams (考研). Extract high-frequency core vocabulary from the given text.',
      },
      {
        role: 'user',
        content: `Extract high-frequency core vocabulary from the following English text. Focus on words that are important for Chinese graduate entrance exams (考研). Exclude basic words and very common vocabulary. For each word, provide:
1. The word spelling (lowercase)
2. A concise interpretation suitable for 考研 context
3. A brief memory aid or note
4. An importance score (1-10, where 10 is most important)

Return the result as a JSON array with this structure:
[
  {
    "spelling": "word",
    "interpretation": "考研释义",
    "note": "记忆提示",
    "importance": 8
  }
]

Text to analyze:
${truncatedContent}`,
      },
    ];

    return await aiRequest<HighFreqWord[]>(apiKey, baseUrl, model, messages);
  },

  async extractSynonymPairs(
    apiKey: string,
    baseUrl: string,
    model: string,
    content: string
  ): Promise<SynonymPair[]> {
    const truncatedContent = truncateContent(content);

    const messages = [
      {
        role: 'system',
        content: 'You are an expert in English vocabulary for Chinese graduate entrance exams (考研). Extract synonym replacement pairs from the given text.',
      },
      {
        role: 'user',
        content: `Extract synonym replacement pairs from the following English text. Each group should contain 2-4 words that can be used interchangeably in 考研 contexts. For each group, provide:
1. The list of synonym words (lowercase)
2. Their common meaning in 考研 context
3. A brief note about when they are used
4. Individual interpretations for each word

Return the result as a JSON array with this structure:
[
  {
    "words": ["word1", "word2", "word3"],
    "meaning": "共同含义",
    "note": "使用场景",
    "interpretations": ["word1释义", "word2释义", "word3释义"]
  }
]

Text to analyze:
${truncatedContent}`,
      },
    ];

    return await aiRequest<SynonymPair[]>(apiKey, baseUrl, model, messages);
  },
};
