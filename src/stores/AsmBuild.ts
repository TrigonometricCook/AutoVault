import { create } from "zustand";

type SelectedItem = {
  id: string;
  versionId?: string; // For components only
  type: "component" | "assembly" | "product";
  quantity: number; // ✅ NEW
};

type SelectedItemStore = {
  selectedItems: SelectedItem[];
  addSelectedItem: (item: Omit<SelectedItem, "quantity">) => void;
  removeSelectedItem: (
    id: string,
    type: "component" | "assembly" | "product",
    versionId?: string
  ) => void;
  updateQuantity: (
    id: string,
    type: "component" | "assembly" | "product",
    quantity: number,
    versionId?: string
  ) => void; // ✅ NEW
  clearSelectedItems: () => void;
};

export const useSelectedItemStore = create<SelectedItemStore>((set) => ({
  selectedItems: [],
  addSelectedItem: (item) =>
    set((state) => {
      let filtered;
      if (item.type === "component") {
        filtered = state.selectedItems.filter(
          (v) =>
            !(
              v.type === "component" &&
              v.id === item.id &&
              v.versionId === item.versionId
            )
        );
      } else {
        filtered = state.selectedItems.filter(
          (v) => !(v.id === item.id && v.type === item.type)
        );
      }

      return {
        selectedItems: [...filtered, { ...item, quantity: 1 }], // ✅ default quantity
      };
    }),

  removeSelectedItem: (id, type, versionId) =>
    set((state) => {
      let filtered;
      if (type === "component" && versionId) {
        filtered = state.selectedItems.filter(
          (v) =>
            !(
              v.type === "component" &&
              v.id === id &&
              v.versionId === versionId
            )
        );
      } else {
        filtered = state.selectedItems.filter(
          (v) => !(v.id === id && v.type === type)
        );
      }
      return { selectedItems: filtered };
    }),

  updateQuantity: (id, type, quantity, versionId) =>
    set((state) => {
      const updated = state.selectedItems.map((item) => {
        const isMatch =
          item.id === id &&
          item.type === type &&
          (type !== "component" || item.versionId === versionId);
        return isMatch
          ? { ...item, quantity: Math.max(1, quantity) } // ✅ clamp to 1
          : item;
      });
      return { selectedItems: updated };
    }),

  clearSelectedItems: () => set({ selectedItems: [] }),
}));
