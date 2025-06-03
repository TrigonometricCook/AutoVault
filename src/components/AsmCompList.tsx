"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const ComponentsList = ({ components, loading, searchTerm }: {
  components: any[];
  loading: boolean;
  searchTerm: string;
}) => {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

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

  if (loading) return <p>Loading...</p>;

  if (filteredComponents.length === 0)
    return <p className="text-gray-500 italic text-center">No components found.</p>;

  return (
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
                      {new Date(ver.created_at).toLocaleDateString()} | Cost: ${ver.cost ?? "N/A"}
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
  );
};

export default ComponentsList;
