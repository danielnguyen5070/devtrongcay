import { create } from "zustand";

type ChatPanelState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useChatStore = create<ChatPanelState>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
