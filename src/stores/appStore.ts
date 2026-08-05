import { create } from 'zustand';

interface AppState {
  studyFinished: number;
  studyTotal: number;
  studyTimeMinutes: number;
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisStep: string;
  isSyncing: boolean;
  syncProgress: number;
  syncStep: string;
  setStudyProgress: (finished: number, total: number, timeMinutes: number) => void;
  setAnalyzing: (isAnalyzing: boolean, progress: number, step: string) => void;
  setSyncing: (isSyncing: boolean, progress: number, step: string) => void;
  resetSync: () => void;
  resetAnalysis: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  studyFinished: 0,
  studyTotal: 0,
  studyTimeMinutes: 0,
  isAnalyzing: false,
  analysisProgress: 0,
  analysisStep: '',
  isSyncing: false,
  syncProgress: 0,
  syncStep: '',
  setStudyProgress: (finished, total, timeMinutes) =>
    set({ studyFinished: finished, studyTotal: total, studyTimeMinutes: timeMinutes }),
  setAnalyzing: (isAnalyzing, progress, step) =>
    set({ isAnalyzing, analysisProgress: progress, analysisStep: step }),
  setSyncing: (isSyncing, progress, step) =>
    set({ isSyncing, syncProgress: progress, syncStep: step }),
  resetSync: () => set({ isSyncing: false, syncProgress: 0, syncStep: '' }),
  resetAnalysis: () => set({ isAnalyzing: false, analysisProgress: 0, analysisStep: '' }),
}));
