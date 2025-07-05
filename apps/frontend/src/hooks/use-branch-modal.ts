import { create } from 'zustand';
import { type Branch } from '@/app/dashboard/branches/components/columns';

interface UseBranchModalStore {
  isOpen: boolean;
  initialData: Branch | null;
  onOpen: (data?: Branch) => void;
  onClose: () => void;
}

export const useBranchModal = create<UseBranchModalStore>((set) => ({
  isOpen: false,
  initialData: null,
  onOpen: (data) => set({ isOpen: true, initialData: data || undefined }),
  onClose: () => set({ isOpen: false, initialData: null }),
}));
