"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import ComponentsList from "./AsmCompList";
import AssembliesList from "./AsmAssemblyList";
import MarketplaceList from "./AsmMarketList";
import { RefreshCw } from "lucide-react";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const Card2 = () => {
  const [selected, setSelected] = useState("components");
  const [components, setComponents] = useState<any[]>([]);
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

  const buttons = [
    { id: "components", label: "Components" },
    { id: "assemblies", label: "Assemblies" },
    { id: "marketplace", label: "Marketplace" },
  ];

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-md flex flex-col p-4 h-174 overflow-y-auto">
      {/* Buttons + Search + Refresh */}
      <div className="flex justify-between items-center pb-1 mb-3">
        {/* Buttons */}
        <div className="flex gap-2">
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
        {/* Search input + Refresh */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={fetchData}
            className="p-1 rounded hover:bg-gray-100 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      {selected === "components" && (
        <ComponentsList
          components={components}
          loading={loading}
          searchTerm={searchTerm}
        />
      )}
      {selected === "assemblies" && (
        <AssembliesList searchTerm={searchTerm} />
      )}
      {selected === "marketplace" && (
        <MarketplaceList searchTerm={searchTerm} />
      )}
    </div>
  );
};

export default Card2;
