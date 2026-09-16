import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DraftItem {
  id: string; // Unique draft ID (e.g., uuid)
  draftImageKey?: string; // idb:// key for the processed/compressed image
  fullDraftImageKey?: string; // idb:// key for the full face image
  originalFileMeta?: { name: string; size: number }; // For UI reference
  metadata: {
    answer: string;
    hint?: string;
    year?: number;
  };
}

interface StudioState {
  drafts: DraftItem[];
  addDraft: (draft: DraftItem) => void;
  updateDraft: (id: string, updates: Partial<DraftItem>) => void;
  removeDraft: (id: string) => void;
  clearDrafts: () => void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      drafts: [],
      addDraft: (draft) => set((state) => ({ drafts: [...state.drafts, draft] })),
      updateDraft: (id, updates) =>
        set((state) => ({
          drafts: state.drafts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),
      removeDraft: (id) =>
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
        })),
      clearDrafts: () => set({ drafts: [] }),
    }),
    {
      name: 'guess-the-frame-studio-storage',
    }
  )
);
