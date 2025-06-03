import { create } from "zustand";

type SelectedItem = {
  id: string; // Could be componentId, assemblyId, or productId
  versionId?: string; // Only for components
  type: "component" | "assembly" | "product";
};

type SelectedItemStore = {
  selectedItems: SelectedItem[];
  addSelectedItem: (item: SelectedItem) => void;
  removeSelectedItem: (
    id: string,
    type: "component" | "assembly" | "product",
    versionId?: string
  ) => void;
  clearSelectedItems: () => void;
};

export const useSelectedItemStore = create<SelectedItemStore>((set) => ({
  selectedItems: [],
  addSelectedItem: (item) =>
    set((state) => {
      let filtered;
      if (item.type === "component") {
        // Remove existing component entry with same id + versionId
        filtered = state.selectedItems.filter(
          (v) =>
            !(
              v.type === "component" &&
              v.id === item.id &&
              v.versionId === item.versionId
            )
        );
      } else {
        // Remove existing assembly or product with same id
        filtered = state.selectedItems.filter(
          (v) => !(v.id === item.id && v.type === item.type)
        );
      }
      return { selectedItems: [...filtered, item] };
    }),
  removeSelectedItem: (id, type, versionId) =>
    set((state) => {
      let filtered;
      if (type === "component" && versionId) {
        // Remove specific version of component
        filtered = state.selectedItems.filter(
          (v) =>
            !(
              v.type === "component" &&
              v.id === id &&
              v.versionId === versionId
            )
        );
      } else {
        // Remove assembly or product by id
        filtered = state.selectedItems.filter(
          (v) => !(v.id === id && v.type === type)
        );
      }
      return { selectedItems: filtered };
    }),
  clearSelectedItems: () => set({ selectedItems: [] }),
}));
