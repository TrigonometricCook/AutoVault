"use client";

import React, { useState } from "react";
import { useSelectedItemStore } from "@/stores/AsmBuild";
import { X, Save } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
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
      // 1️⃣ Insert the new assembly
      const { data: newAssembly, error: assemblyError } = await supabase
        .from("assemblies")
        .insert({
          assembly_name: assemblyName,
          description: description,
          status: "draft",
          space_occupancy: 0, // default
        })
        .select("assembly_id")
        .single();

      if (assemblyError) throw assemblyError;

      const assemblyId = newAssembly.assembly_id;

      // 2️⃣ Prepare the nodes to insert
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

      // 3️⃣ Insert the nodes
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
    <div
      className="border border-blue-900 rounded-lg p-4 text-white flex flex-col gap-2 shadow"
      style={{ backgroundColor: "#002969" }}
    >
      <h4 className="text-lg font-semibold">Add Assembly</h4>

      <input
        type="text"
        placeholder="Assembly Name"
        value={assemblyName}
        onChange={(e) => setAssemblyName(e.target.value)}
        className="border border-blue-900 rounded px-2 py-1 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border border-blue-900 rounded px-2 py-1 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="flex flex-col gap-1 text-sm mt-2">
        {selectedItems.length === 0 ? (
          <p className="italic text-gray-300 text-center">
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
              className="flex justify-between items-center bg-blue-800 rounded px-2 py-1"
            >
              <span>
                <span className="font-medium">{item.id}</span>
                {item.type === "component" && item.versionId
                  ? ` — v${item.versionId}`
                  : ""}
                {" "}
                ({item.type})
              </span>
              <button
                onClick={() => removeSelectedItem(item.id, item.type)}
                className="text-red-300 hover:text-red-500 transition"
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
          className="flex items-center gap-1 px-3 py-1 text-sm border border-blue-900 text-white rounded hover:bg-blue-900 transition"
        >
          <X className="w-4 h-4" /> Clear All
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-3 py-1 text-sm rounded transition bg-yellow-400 text-black hover:bg-yellow-500"
        >
          <Save className="w-4 h-4" /> Save
        </button>
      </div>
    </div>
  );
};

export default SelectedItemsList;
