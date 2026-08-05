import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  maimemoToken: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  aiModel: string;
  setMaimemoToken: (token: string) => void;
  setOpenaiApiKey: (apiKey: string) => void;
  setOpenaiBaseUrl: (baseUrl: string) => void;
  setAiModel: (model: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      maimemoToken: '',
      openaiApiKey: '',
      openaiBaseUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-4o',
      setMaimemoToken: (token) => set({ maimemoToken: token }),
      setOpenaiApiKey: (apiKey) => set({ openaiApiKey: apiKey }),
      setOpenaiBaseUrl: (baseUrl) => set({ openaiBaseUrl: baseUrl }),
      setAiModel: (model) => set({ aiModel: model }),
    }),
    {
      name: 'vocab-assistant-settings',
    }
  )
);
