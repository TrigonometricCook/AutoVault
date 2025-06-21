"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X } from "lucide-react";

type Assembly = {
  assembly_id: number;
  assembly_name: string | null;
};

type SelectedAssembly = {
  assembly_id: number;
  assembly_name: string | null;
  quantity: number;
};

const statusOptions = ["planned", "active", "on_hold", "completed", "cancelled"];

export default function NewProjectForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planned");
  const [submitting, setSubmitting] = useState(false);

  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [selectedAssemblies, setSelectedAssemblies] = useState<SelectedAssembly[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAssemblies = async () => {
      const { data, error } = await supabase
        .from("assemblies")
        .select("assembly_id, assembly_name")
        .order("assembly_id");

      if (error) {
        console.error("Failed to fetch assemblies", error);
      } else {
        setAssemblies(data || []);
      }
    };

    fetchAssemblies();
  }, []);

  const addAssembly = (assembly: Assembly) => {
    if (!selectedAssemblies.find((a) => a.assembly_id === assembly.assembly_id)) {
      setSelectedAssemblies((prev) => [
        ...prev,
        { ...assembly, quantity: 1 },
      ]);
    }
  };

  const updateQuantity = (id: number, newQty: number) => {
    setSelectedAssemblies((prev) =>
      prev.map((a) =>
        a.assembly_id === id ? { ...a, quantity: newQty } : a
      )
    );
  };

  const removeAssembly = (id: number) => {
    setSelectedAssemblies((prev) => prev.filter((a) => a.assembly_id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Project name is required.");
    if (selectedAssemblies.length === 0) return alert("Add at least one assembly.");

    setSubmitting(true);

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .insert({
        project_name: name,
        description,
        status,
      })
      .select("project_id")
      .single();

    if (projectError || !projectData) {
      console.error("Project creation failed:", projectError);
      alert("Failed to create project.");
      setSubmitting(false);
      return;
    }

    const projectId = projectData.project_id;

    const insertData = selectedAssemblies.map((a) => ({
      project_id: projectId,
      assembly_id: a.assembly_id,
      quantity: a.quantity,
    }));

    const { error: linkError } = await supabase
      .from("project_assemblies")
      .insert(insertData);

    if (linkError) {
      console.error("Failed to link assemblies:", linkError);
      alert("Project created, but assemblies not linked.");
    } else {
      alert("Project and assemblies created successfully!");
    }

    setName("");
    setDescription("");
    setStatus("planned");
    setSelectedAssemblies([]);
    setSubmitting(false);
  };

  const filteredAssemblies = assemblies.filter(
    (a) =>
      a.assembly_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assembly_id.toString().includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Project</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option.replace(/_/g, " ").toUpperCase()}
            </option>
          ))}
        </select>

        {/* Assembly Selector */}
        <div className="mt-2">
          <h3 className="text-md font-semibold text-gray-700 mb-2">Add Assemblies</h3>

          <input
            type="text"
            placeholder="Search assemblies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2 border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
            {filteredAssemblies.length === 0 ? (
              <p className="text-sm text-gray-400">No assemblies found.</p>
            ) : (
              filteredAssemblies.map((a) => {
                const isSelected = selectedAssemblies.some(
                  (s) => s.assembly_id === a.assembly_id
                );

                return (
                  <div key={a.assembly_id} className="flex justify-between items-center text-sm">
                    <span>
                      {a.assembly_name || "Unnamed"} (ID: {a.assembly_id})
                    </span>
                    <button
                      type="button"
                      disabled={isSelected}
                      onClick={() => addAssembly(a)}
                      className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Assemblies with Quantities */}
          {selectedAssemblies.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-600 mb-1">Selected Assemblies:</p>
              <ul className="flex flex-col gap-2">
                {selectedAssemblies.map((a) => (
                  <li
                    key={a.assembly_id}
                    className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded text-sm"
                  >
                    <span className="flex-1">
                      {a.assembly_name || "Unnamed"} (ID: {a.assembly_id})
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={a.quantity}
                      onChange={(e) =>
                        updateQuantity(a.assembly_id, Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-16 text-right border border-gray-300 rounded px-2 py-0.5 mx-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeAssembly(a.assembly_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
