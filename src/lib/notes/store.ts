import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { filterNotes, sortNotes } from "./format";
import { SEED_NOTES } from "./seed";
import type { Note } from "./types";

type NotesState = {
  notes: Note[];
  selectedId: string | null;
  search: string;
  preview: boolean;
  createNote: () => string;
  deleteNote: (id: string) => void;
  updateNote: (id: string, content: string) => void;
  selectNote: (id: string | null) => void;
  setSearch: (search: string) => void;
  setPreview: (preview: boolean) => void;
  togglePreview: () => void;
  selectOffset: (delta: number) => void;
};

function visibleNotes(notes: Note[], search: string): Note[] {
  return filterNotes(sortNotes(notes), search);
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: SEED_NOTES,
      selectedId: SEED_NOTES[0]?.id ?? null,
      search: "",
      preview: false,

      createNote: () => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const note: Note = { id, content: "", createdAt: now, updatedAt: now };
        set((state) => ({
          notes: [note, ...state.notes],
          selectedId: id,
          search: "",
          preview: false,
        }));
        return id;
      },

      deleteNote: (id) => {
        set((state) => {
          const remaining = state.notes.filter((note) => note.id !== id);
          const visible = visibleNotes(remaining, state.search);
          let selectedId = state.selectedId;
          if (state.selectedId === id) {
            const previousVisible = visibleNotes(state.notes, state.search);
            const index = previousVisible.findIndex((note) => note.id === id);
            selectedId =
              visible[index]?.id ?? visible[index - 1]?.id ?? visible[0]?.id ?? null;
          }
          return { notes: remaining, selectedId };
        });
      },

      updateNote: (id, content) => {
        const now = Date.now();
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, content, updatedAt: now } : note,
          ),
        }));
      },

      selectNote: (id) => set({ selectedId: id }),

      setSearch: (search) => {
        set((state) => {
          const visible = visibleNotes(state.notes, search);
          const keep =
            state.selectedId && visible.some((note) => note.id === state.selectedId);
          return {
            search,
            selectedId: keep ? state.selectedId : (visible[0]?.id ?? null),
          };
        });
      },

      setPreview: (preview) => set({ preview }),
      togglePreview: () => set((state) => ({ preview: !state.preview })),

      selectOffset: (delta) => {
        const { notes, search, selectedId } = get();
        const visible = visibleNotes(notes, search);
        if (visible.length === 0) return;
        const current = visible.findIndex((note) => note.id === selectedId);
        const index =
          current === -1
            ? delta > 0
              ? 0
              : visible.length - 1
            : Math.max(0, Math.min(visible.length - 1, current + delta));
        set({ selectedId: visible[index].id });
      },
    }),
    {
      name: "mojian-notes",
      storage:
        typeof window === "undefined"
          ? undefined
          : createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        notes: state.notes,
        selectedId: state.selectedId,
        preview: state.preview,
      }),
    },
  ),
);
