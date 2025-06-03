"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { ChevronDown, ChevronRight } from "lucide-react";

// Initialize Supabase client (replace with your actual keys)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const Card2 = () => {
  const [selected, setSelected] = useState("components");
  const [components, setComponents] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: componentsData, error: componentsError } = await supabase
      .from("components")
      .select("*")
      .order("part_number", { ascending: true });

    if (componentsError) {
      console.error("Error fetching components:", componentsError.message);
      setLoading(false);
      return;
    }

    const { data: versionsData, error: versionsError } = await supabase
      .from("component_versions")
      .select("*");

    if (versionsError) {
      console.error("Error fetching versions:", versionsError.message);
      setLoading(false);
      return;
    }

    const enrichedComponents = componentsData!.map((comp) => ({
      ...comp,
      versions: versionsData!.filter((ver) => ver.part_number === comp.part_number),
    }));

    setComponents(enrichedComponents);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (partNumber: string) => {
    setExpanded((prev) => ({
      ...prev,
      [partNumber]: !prev[partNumber],
    }));
  };

  const filteredComponents = components.filter(
    (comp) =>
      comp.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.part_number.toLowerCase().includes(searchTerm)
  );

  const buttons = [
    { id: "components", label: "Components" },
    { id: "assemblies", label: "Assemblies" },
    { id: "marketplace", label: "Marketplace" },
  ];

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-md flex flex-col p-4 h-174 overflow-y-auto">
      {/* Buttons */}
      <div className="flex justify-around border-b border-gray-200 pb-2 mb-3">
        {buttons.map((button) => (
          <button
            key={button.id}
            onClick={() => setSelected(button.id)}
            className={`py-1.5 px-3 rounded text-sm font-medium transition ${
              selected === button.id
                ? "bg-blue-500 text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Content */}
      {selected === "components" ? (
        loading ? (
          <p>Loading...</p>
        ) : filteredComponents.length === 0 ? (
          <p className="text-gray-500 italic text-center">No components found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredComponents.map((comp) => (
              <div key={comp.part_number} className="border border-gray-200 rounded">
                {/* Component Header */}
                <div
                  onClick={() => toggleExpand(comp.part_number)}
                  className="flex justify-between items-center p-2 cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    {expanded[comp.part_number] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    {comp.part_name || "Unnamed"} (PN: {comp.part_number})
                  </div>
                  <div className="text-sm text-gray-500">{comp.status || "-"}</div>
                </div>

                {/* Collapsible Content */}
                {expanded[comp.part_number] && (
                  <div className="p-2 text-sm text-gray-700">
                    <p className="italic text-gray-600 mb-1">{comp.description || "No description"}</p>
                    <p className="font-semibold">Versions:</p>
                    {comp.versions.length === 0 ? (
                      <p className="text-gray-500 italic">No versions available.</p>
                    ) : (
                      <ul className="list-disc pl-5">
                        {comp.versions.map((ver: any) => (
                          <li key={ver.version_number} className="mb-1">
                            <span className="font-medium">v{ver.version_number}</span> —{" "}
                            {ver.created_by} on{" "}
                            {new Date(ver.created_at).toLocaleDateString()} | Cost: $
                            {ver.cost ?? "N/A"}
                            {ver.file_path && (
                              <>
                                {" "}
                                —{" "}
                                <a
                                  href={ver.file_path}
                                  className="text-blue-500 hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View File
                                </a>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <p className="text-gray-500 italic text-center">{selected} content goes here.</p>
      )}
    </div>
  );
};

export default Card2;
