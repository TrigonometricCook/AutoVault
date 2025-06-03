"use client";

import React, { useState } from "react";
import { useSelectedItemStore } from "@/stores/AsmBuild";
import { X, Save } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SelectedItemsList = () => {
  const {
    selectedItems,
    removeSelectedItem,
    clearSelectedItems,
  } = useSelectedItemStore();

  const [assemblyName, setAssemblyName] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    if (!assemblyName.trim()) {
      alert("Assembly Name is required!");
      return;
    }

    try {
      // Insert new assembly (space_occupancy removed)
      const { data: newAssembly, error: assemblyError } = await supabase
        .from("assemblies")
        .insert({
          assembly_name: assemblyName,
          description: description,
          status: "draft",
        })
        .select("assembly_id")
        .single();

      if (assemblyError) throw assemblyError;

      const assemblyId = newAssembly.assembly_id;

      const nodesToInsert = selectedItems.map((item) => {
        if (item.type === "component") {
          return {
            assembly_id: assemblyId,
            component_part_number: item.id,
            sub_assembly_id: null,
            listing_id: null,
            quantity: 1,
          };
        } else if (item.type === "assembly") {
          return {
            assembly_id: assemblyId,
            component_part_number: null,
            sub_assembly_id: parseInt(item.id, 10),
            listing_id: null,
            quantity: 1,
          };
        } else if (item.type === "product") {
          return {
            assembly_id: assemblyId,
            component_part_number: null,
            sub_assembly_id: null,
            listing_id: parseInt(item.id, 10),
            quantity: 1,
          };
        }
        throw new Error("Unsupported item type");
      });

      const { error: nodeError } = await supabase
        .from("assembly_nodes")
        .insert(nodesToInsert);

      if (nodeError) throw nodeError;

      alert("Assembly saved successfully!");
      setAssemblyName("");
      setDescription("");
      clearSelectedItems();
    } catch (error: any) {
      console.error("Error saving assembly:", error);
      alert("Error saving assembly: " + error.message);
    }
  };

  const handleClear = () => {
    setAssemblyName("");
    setDescription("");
    clearSelectedItems();
  };

  return (
    <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm flex flex-col gap-3">
      <h4 className="text-lg font-semibold text-gray-800 mb-1">Add Assembly</h4>

      <input
        type="text"
        placeholder="Assembly Name"
        value={assemblyName}
        onChange={(e) => setAssemblyName(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="flex flex-col gap-1 text-sm mt-2 max-h-40 overflow-y-auto">
        {selectedItems.length === 0 ? (
          <p className="italic text-gray-400 text-center py-2">
            No selected items.
          </p>
        ) : (
          selectedItems.map((item) => (
            <div
              key={
                item.type === "component"
                  ? `${item.id}-${item.versionId}`
                  : `${item.id}-${item.type}`
              }
              className="flex justify-between items-center bg-gray-100 rounded-lg px-3 py-1.5 hover:bg-gray-200 transition"
            >
              <span className="truncate text-gray-800">
                <span className="font-medium">{item.id}</span>
                {item.type === "component" && item.versionId
                  ? ` — v${item.versionId}`
                  : ""}
                {" "}
                ({item.type})
              </span>
              <button
                onClick={() => removeSelectedItem(item.id, item.type)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={handleClear}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
        >
          <X className="w-4 h-4" /> Clear All
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition bg-blue-500 text-white hover:bg-blue-600 font-medium"
        >
          <Save className="w-4 h-4" /> Save
        </button>
      </div>
    </div>
  );
};

export default SelectedItemsList;
