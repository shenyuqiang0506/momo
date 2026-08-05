import { parseFile, parseText } from './fileParser';
import { aiAPI } from '../api/ai';
import { articleDB, wordDB } from '../db';
import { useAppStore } from '../stores/appStore';
import type { Word } from '../types';

export interface AnalysisResult {
  articleId: number;
  highFreqCount: number;
  synonymGroupCount: number;
  totalWordCount: number;
}

export async function analyzeFiles(
  files: File[],
  batchName: string
): Promise<AnalysisResult> {
  const { setAnalyzing, resetAnalysis } = useAppStore.getState();

  try {
    setAnalyzing(true, 0, 'Parsing files...');

    // Parse all files and merge content
    let mergedContent = '';
    let totalCharCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await parseFile(file);
      mergedContent += result.text + '\n\n';
      totalCharCount += result.charCount;

      const progress = Math.round(((i + 1) / files.length) * 20);
      setAnalyzing(true, progress, `Parsing file ${i + 1}/${files.length}...`);
    }

    // Check for duplicates
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(mergedContent)
    );
    const hashHex = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const existingArticle = await articleDB.getByHash(hashHex);
    if (existingArticle) {
      throw new Error('This content has already been analyzed');
    }

    // Create article record
    setAnalyzing(true, 20, 'Creating article record...');
    const articleId = await articleDB.create({
      title: files.length === 1 ? files[0].name : `${files.length} files`,
      sourceType: files[0].name.endsWith('.pdf') ? 'pdf' : 'txt',
      contentHash: hashHex,
      batchName,
      charCount: totalCharCount,
      status: 'analyzing',
      createdAt: new Date(),
    });

    try {
      // Extract high-frequency words
      setAnalyzing(true, 25, 'Extracting high-frequency words...');
      const apiKey = localStorage.getItem('vocab-assistant-settings')
        ? JSON.parse(localStorage.getItem('vocab-assistant-settings')!).state.openaiApiKey
        : '';
      const baseUrl = localStorage.getItem('vocab-assistant-settings')
        ? JSON.parse(localStorage.getItem('vocab-assistant-settings')!).state.openaiBaseUrl
        : 'https://api.openai.com/v1';
      const model = localStorage.getItem('vocab-assistant-settings')
        ? JSON.parse(localStorage.getItem('vocab-assistant-settings')!).state.aiModel
        : 'gpt-4o';

      const highFreqWords = await aiAPI.extractHighFreqWords(
        apiKey,
        baseUrl,
        model,
        mergedContent
      );

      setAnalyzing(true, 50, 'Extracting synonym pairs...');
      const synonymPairs = await aiAPI.extractSynonymPairs(
        apiKey,
        baseUrl,
        model,
        mergedContent
      );

      // Save words to database
      setAnalyzing(true, 60, 'Saving words to database...');

      const wordsToSave: Omit<Word, 'id'>[] = [];

      // Add high-frequency words
      highFreqWords.forEach((word, index) => {
        wordsToSave.push({
          articleId,
          spelling: word.spelling.toLowerCase(),
          interpretation: word.interpretation,
          note: word.note,
          category: 'high_frequency',
          frequency: word.importance,
          isSelected: false,
          isSynced: false,
          createdAt: new Date(),
        });
      });

      // Add synonym pairs
      synonymPairs.forEach((pair, index) => {
        const groupId = `synonym-${Date.now()}-${index}`;
        pair.words.forEach(word => {
          wordsToSave.push({
            articleId,
            spelling: word.toLowerCase(),
            interpretation: pair.interpretations[pair.words.indexOf(word)] || pair.meaning,
            note: pair.note,
            category: 'synonym',
            synonymGroupId: groupId,
            synonymMeaning: pair.meaning,
            frequency: 5, // Default frequency for synonyms
            isSelected: false,
            isSynced: false,
            createdAt: new Date(),
          });
        });
      });

      await wordDB.bulkCreate(wordsToSave);

      // Update article status
      setAnalyzing(true, 90, 'Updating article status...');
      await articleDB.update(articleId, { status: 'analyzed' });

      setAnalyzing(true, 100, 'Analysis complete!');

      return {
        articleId,
        highFreqCount: highFreqWords.length,
        synonymGroupCount: synonymPairs.length,
        totalWordCount: wordsToSave.length,
      };
    } catch (error) {
      // Rollback on error
      await articleDB.update(articleId, { status: 'uploaded' });
      throw error;
    }
  } finally {
    setTimeout(() => resetAnalysis(), 2000);
  }
}

export async function analyzeText(
  text: string,
  batchName: string
): Promise<AnalysisResult> {
  // Create a File object from the text
  const file = new File([text], 'pasted-text.txt', { type: 'text/plain' });
  return await analyzeFiles([file], batchName);
}
