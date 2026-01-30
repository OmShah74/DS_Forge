import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '@/lib/api';

export interface Activity {
    id: number;
    operation: string;
    status: string;
    message: string;
    metadata_json?: any;
    created_at: string;
}

interface ExplainabilityState {
    activities: Activity[];
    isActivityLogOpen: boolean;
    isHelpOpen: boolean;
    activeHelpSection: string | null;
    loading: boolean;

    fetchActivities: () => Promise<void>;
    toggleActivityLog: () => void;
    openHelp: (section: string) => void;
    closeHelp: () => void;
}

export const useExplainabilityStore = create<ExplainabilityState>((set) => ({
    activities: [],
    isActivityLogOpen: false,
    isHelpOpen: false,
    activeHelpSection: null,
    loading: false,

    fetchActivities: async () => {
        set({ loading: true });
        try {
            const res = await axios.get(`${API_URL}/activities`);
            set({ activities: res.data, loading: false });
        } catch (error) {
            console.error("Failed to fetch activities:", error);
            set({ loading: false });
        }
    },

    toggleActivityLog: () => set((state) => ({ isActivityLogOpen: !state.isActivityLogOpen })),

    openHelp: (section) => set({ isHelpOpen: true, activeHelpSection: section }),

    closeHelp: () => set({ isHelpOpen: false, activeHelpSection: null }),
}));
