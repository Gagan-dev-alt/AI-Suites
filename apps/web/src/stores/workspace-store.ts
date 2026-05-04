import { create } from "zustand";

type WorkspaceState = {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedModel: "openrouter/free",
  setSelectedModel: (selectedModel) => set({ selectedModel })
}));
