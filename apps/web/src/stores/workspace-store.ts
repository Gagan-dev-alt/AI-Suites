import { create } from "zustand";

type WorkspaceState = {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedModel: "Claude Sonnet",
  setSelectedModel: (selectedModel) => set({ selectedModel })
}));
