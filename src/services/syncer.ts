import { maimemoAPI } from '../api/maimemo';
import { wordDB, syncLogDB } from '../db';
import { useAppStore } from '../stores/appStore';
import type { Word } from '../types';

export interface SyncOptions {
  createNotepad?: boolean;
  addToPlan?: boolean;
  writeInterpretation?: boolean;
  writeNote?: boolean;
}

export interface SyncResult {
  successCount: number;
  failCount: number;
  notepadId?: string;
  errors: string[];
}

export async function fullSync(
  wordIds: number[],
  options: SyncOptions
): Promise<SyncResult> {
  const { setSyncing, resetSync } = useAppStore.getState();
  const errors: string[] = [];
  let successCount = 0;
  let failCount = 0;
  let notepadId: string | undefined;

  try {
    setSyncing(true, 0, 'Getting selected words...');

    // Get selected words by IDs
    const allWords = await wordDB.list();
    const selectedWords = allWords.filter(w => wordIds.includes(w.id!));
    if (selectedWords.length === 0) {
      throw new Error('No words selected for sync');
    }

    // Collect unique spellings
    const spellings = Array.from(
      new Set(selectedWords.map(w => w.spelling.toLowerCase()))
    );

    setSyncing(true, 10, 'Querying Maimemo word IDs...');
    const token = localStorage.getItem('vocab-assistant-settings')
      ? JSON.parse(localStorage.getItem('vocab-assistant-settings')!).state.maimemoToken
      : '';

    // Query Maimemo word IDs
    const wordIdMap = await maimemoAPI.queryWordIds(token, spellings);

    setSyncing(true, 30, 'Matching words with Maimemo IDs...');

    // Update words with Maimemo IDs
    const matchedWords: Word[] = [];
    for (const word of selectedWords) {
      const maimemoId = wordIdMap[word.spelling.toLowerCase()];
      if (maimemoId) {
        await wordDB.update(word.id!, { maimemoVocId: maimemoId });
        matchedWords.push({ ...word, maimemoVocId: maimemoId });
      }
    }

    if (matchedWords.length === 0) {
      throw new Error('No words matched with Maimemo vocabulary');
    }

    // Create notepad if enabled
    if (options.createNotepad) {
      setSyncing(true, 40, 'Creating cloud notepad...');

      // Generate notepad content
      const highFreqWords = matchedWords.filter(w => w.category === 'high_frequency');
      const synonymGroups = new Map<string, Word[]>();

      matchedWords.forEach(w => {
        if (w.category === 'synonym' && w.synonymGroupId) {
          if (!synonymGroups.has(w.synonymGroupId)) {
            synonymGroups.set(w.synonymGroupId, []);
          }
          synonymGroups.get(w.synonymGroupId)!.push(w);
        }
      });

      let notepadContent = '# 高频核心词汇\n\n';
      highFreqWords.forEach(w => {
        notepadContent += `${w.spelling}\n`;
      });

      synonymGroups.forEach((words) => {
        const meaning = words[0].synonymMeaning || '同义替换';
        notepadContent += `\n# 同义替换: ${meaning}\n\n`;
        words.forEach(w => {
          notepadContent += `${w.spelling}\n`;
        });
      });

      const notepadResult = await maimemoAPI.createNotepad(
        token,
        `考研词汇-${new Date().toLocaleDateString()}`,
        notepadContent,
        ['考研', '词汇']
      );

      notepadId = notepadResult.notepad_id;
    }

    // Write interpretations if enabled
    if (options.writeInterpretation) {
      setSyncing(true, 50, 'Writing interpretations...');
      const total = matchedWords.length;
      let current = 0;

      for (const word of matchedWords) {
        if (word.interpretation && word.maimemoVocId) {
          try {
            await maimemoAPI.createInterpretation(
              token,
              word.maimemoVocId,
              word.interpretation,
              ['考研']
            );
            successCount++;
          } catch (error) {
            failCount++;
            errors.push(`Failed to write interpretation for ${word.spelling}`);
          }
        }
        current++;
        const progress = 50 + Math.round((current / total) * 20);
        setSyncing(true, progress, `Writing interpretations (${current}/${total})...`);
      }
    }

    // Write notes if enabled
    if (options.writeNote) {
      setSyncing(true, 70, 'Writing memory notes...');
      const total = matchedWords.length;
      let current = 0;

      for (const word of matchedWords) {
        if (word.note && word.maimemoVocId) {
          try {
            await maimemoAPI.createNote(
              token,
              word.maimemoVocId,
              'memory',
              word.note
            );
            successCount++;
          } catch (error) {
            failCount++;
            errors.push(`Failed to write note for ${word.spelling}`);
          }
        }
        current++;
        const progress = 70 + Math.round((current / total) * 20);
        setSyncing(true, progress, `Writing notes (${current}/${total})...`);
      }
    }

    // Add to study plan if enabled
    if (options.addToPlan) {
      setSyncing(true, 90, 'Adding to study plan...');
      const maimemoIds = matchedWords
        .filter(w => w.maimemoVocId)
        .map(w => w.maimemoVocId!);

      // Split into batches of 500
      const BATCH_SIZE = 500;
      for (let i = 0; i < maimemoIds.length; i += BATCH_SIZE) {
        const batch = maimemoIds.slice(i, i + BATCH_SIZE);
        await maimemoAPI.addWords(token, batch, false);
      }

      successCount += maimemoIds.length;
    }

    // Mark words as synced
    setSyncing(true, 95, 'Marking words as synced...');
    const idsToMark = matchedWords.map(w => w.id!);
    await wordDB.bulkMarkSynced(idsToMark);

    // Create sync log
    setSyncing(true, 100, 'Creating sync log...');
    await syncLogDB.create({
      syncType: 'full',
      wordCount: matchedWords.length,
      successCount,
      failCount,
      notepadId,
      createdAt: new Date(),
    });

    setSyncing(true, 100, 'Sync complete!');

    return {
      successCount,
      failCount,
      notepadId,
      errors,
    };
  } catch (error) {
    throw error;
  } finally {
    setTimeout(() => resetSync(), 2000);
  }
}
