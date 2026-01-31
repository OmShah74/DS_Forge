import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LLMProvider = 'openai' | 'groq' | 'gemini' | 'openrouter';

interface ConfigState {
    llmProvider: LLMProvider;
    apiKey: string;
    modelName: string;
    setProvider: (provider: LLMProvider) => void;
    setApiKey: (key: string) => void;
    setModelName: (name: string) => void;
}

export const useConfigStore = create<ConfigState>()(
    persist(
        (set) => ({
            llmProvider: 'openai',
            apiKey: '',
            modelName: 'gpt-4o',
            setProvider: (provider) => set({ llmProvider: provider }),
            setApiKey: (apiKey) => set({ apiKey }),
            setModelName: (modelName) => set({ modelName }),
        }),
        {
            name: 'ds-forge-config',
        }
    )
);

export const getProviderDefaults = (provider: LLMProvider) => {
    switch (provider) {
        case 'openai': return { model: 'gpt-4o' };
        case 'groq': return { model: 'llama3-70b-8192' };
        case 'gemini': return { model: 'gemini-1.5-pro' };
        case 'openrouter': return { model: 'anthropic/claude-3-opus' };
        default: return { model: '' };
    }
};
