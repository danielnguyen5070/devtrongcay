import { create } from "zustand";

type UiState = {
  hoveredSlug: string | null;
  setHoveredSlug: (slug: string | null) => void;
};

export const useUiStore = create<UiState>((set) => ({
  hoveredSlug: null,
  setHoveredSlug: (slug) => set({ hoveredSlug: slug }),
}));
