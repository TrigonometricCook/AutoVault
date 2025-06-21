"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import NewProjectForm from "./NewProjectForm";
import { RefreshCw } from "lucide-react";

type Project = {
  project_id: number;
  project_name: string | null;
  description: string | null;
  status: string;
};

type AssemblyDetail = {
  assembly_id: number;
  assembly_name: string | null;
  quantity: number;
};

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assembliesMap, setAssembliesMap] = useState<{
    [projectId: number]: AssemblyDetail[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllProjects = async () => {
    setLoading(true);

    const { data: projectsData, error: projectErr } = await supabase
      .from("projects")
      .select("*")
      .order("project_id");

    if (projectErr) {
      console.error("Error fetching projects:", projectErr);
      setLoading(false);
      return;
    }

    setProjects(projectsData || []);

    const { data: linkData, error: linkErr } = await supabase
      .from("project_assemblies")
      .select("project_id, assembly_id, quantity");

    if (linkErr) {
      console.error("Error fetching project assemblies:", linkErr);
      setLoading(false);
      return;
    }

    const { data: assembliesData, error: assemblyErr } = await supabase
      .from("assemblies")
      .select("assembly_id, assembly_name");

    if (assemblyErr) {
      console.error("Error fetching assemblies:", assemblyErr);
      setLoading(false);
      return;
    }

    const asmMap = new Map<number, string | null>();
    assembliesData?.forEach((a) => asmMap.set(a.assembly_id, a.assembly_name));

    const assemblyGroup: { [key: number]: AssemblyDetail[] } = {};
    linkData?.forEach(({ project_id, assembly_id, quantity }) => {
      const name = asmMap.get(assembly_id) || "Unnamed";
      if (!assemblyGroup[project_id]) assemblyGroup[project_id] = [];
      assemblyGroup[project_id].push({ assembly_id, assembly_name: name, quantity });
    });

    setAssembliesMap(assemblyGroup);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllProjects();
  }, []);

  const filteredProjects = projects.filter(
    (p) =>
      p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex gap-4 p-6 h-[calc(100vh-4rem)]">
      {/* Left: Project List */}
      <div className="w-1/2 flex flex-col border-r border-gray-200 pr-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Projects</h2>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={fetchAllProjects}
              className="p-2 rounded-full hover:bg-gray-200 transition"
              title="Reload Projects"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : filteredProjects.length === 0 ? (
            <p className="text-gray-400">No matching projects found.</p>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.project_id}
                className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white hover:shadow transition"
              >
                <h3 className="text-lg font-semibold text-gray-800">
                  {project.project_name || "Untitled Project"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {project.description || "No description."}
                </p>
                <div className="mt-2 text-xs text-gray-500 italic">
                  Status: {project.status}
                </div>

                {assembliesMap[project.project_id]?.length ? (
                  <div className="mt-3 text-sm">
                    <p className="font-medium text-gray-700 mb-1">Assemblies:</p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {assembliesMap[project.project_id].map((a) => (
                        <li key={a.assembly_id}>
                          {a.assembly_name || "Unnamed"} (ID: {a.assembly_id}) — Qty:{" "}
                          <span className="font-semibold">{a.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm mt-3 italic">
                    No assemblies linked
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: New Project Form */}
      <div className="w-1/2 pl-2 overflow-y-auto">
        <NewProjectForm />
      </div>
    </div>
  );
}
