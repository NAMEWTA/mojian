export type Note = {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

export type NotesSnapshot = {
  notes: Note[];
  selectedId: string | null;
  preview: boolean;
};
