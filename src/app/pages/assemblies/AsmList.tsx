"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChevronDown,
  ChevronRight,
  Box,
  Layers,
  RefreshCw,
  Plus,
  X,
} from "lucide-react";
import AddAssemblyCard from "@/app/pages/assemblies/NewAsm";

interface AssemblyNode {
  node_id: number;
  assembly_id: number;
  component_part_number: string | null;
  sub_assembly_id: number | null;
  listing_id: number | null;
  quantity: number;
}

interface Assembly {
  assembly_id: number;
  assembly_name: string | null;
  status: string | null;
  space_occupancy: number;
}

interface TreeNode {
  id: number;
  label: string;
  children?: TreeNode[];
  data: AssemblyNode;
}

const AssemblyTreeCard = () => {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [assemblyNodes, setAssemblyNodes] = useState<AssemblyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [expandedAssemblies, setExpandedAssemblies] = useState<{
    [key: number]: boolean;
  }>({});
  const [expandedNodes, setExpandedNodes] = useState<{
    [key: number]: boolean;
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: assembliesData, error: assembliesError } = await supabase
      .from("assemblies")
      .select("*")
      .order("assembly_id", { ascending: true });

    if (assembliesError) {
      console.error("Error fetching assemblies:", assembliesError);
      setLoading(false);
      return;
    }
    setAssemblies(assembliesData || []);

    const { data: nodesData, error: nodesError } = await supabase
      .from("assembly_nodes")
      .select("*");

    if (nodesError) {
      console.error("Error fetching nodes:", nodesError);
      setLoading(false);
      return;
    }

    setAssemblyNodes(nodesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const buildTree = (assemblyId: number): TreeNode[] => {
    const nodes = assemblyNodes.filter(
      (node) => node.assembly_id === assemblyId
    );
    const map: { [key: number]: TreeNode } = {};
    const roots: TreeNode[] = [];

    nodes.forEach((node) => {
      map[node.node_id] = {
        id: node.node_id,
        label: node.component_part_number
          ? `Component: ${node.component_part_number}`
          : node.sub_assembly_id
          ? `Sub-assembly: ${node.sub_assembly_id}`
          : node.listing_id
          ? `Listing: ${node.listing_id}`
          : "Unknown",
        data: node,
        children: [],
      };
    });

    nodes.forEach((node) => {
      if (node.sub_assembly_id && map[node.sub_assembly_id]) {
        map[node.sub_assembly_id].children?.push(map[node.node_id]);
      } else {
        roots.push(map[node.node_id]);
      }
    });

    return roots;
  };

  const toggleAssembly = (assemblyId: number) => {
    setExpandedAssemblies((prev) => {
      const isExpanding = !prev[assemblyId];
      const newState: { [key: number]: boolean } = {};
      if (isExpanding) {
        newState[assemblyId] = true; // expand the new one
      }
      return newState; // collapse all others
    });
  };

  const toggleNode = (nodeId: number) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const TreeNodeComponent = ({ node }: { node: TreeNode }) => {
    const hasChildren = !!node.children?.length;
    const isOpen = expandedNodes[node.id] || false;

    const handleClick = () => {
      setSelectedNodeId(node.id);
      if (hasChildren || node.data.sub_assembly_id) {
        toggleNode(node.id);
      }
    };

    return (
      <div className="ml-4">
        <div
          onClick={handleClick}
          className={`flex items-center gap-1 cursor-pointer px-1 py-0.5 rounded ${
            selectedNodeId === node.id
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-gray-100 text-gray-800"
          }`}
        >
          {hasChildren || node.data.sub_assembly_id ? (
            isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <Box className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm">
            {node.label} (qty: {node.data.quantity})
          </span>
        </div>

        {isOpen && (
          <div className="ml-4">
            {/* Render normal children */}
            {hasChildren &&
              node.children?.map((child) => (
                <TreeNodeComponent key={child.id} node={child} />
              ))}

            {/* Render sub-assembly as a nested subtree */}
            {node.data.sub_assembly_id && (
              <div className="mt-1 ml-2 border-l-2 border-blue-300 pl-2">
                {buildTree(node.data.sub_assembly_id).map((subNode) => (
                  <TreeNodeComponent key={subNode.id} node={subNode} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredAssemblies = assemblies.filter(
    (assembly) =>
      assembly.assembly_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assembly.assembly_id.toString().includes(searchTerm)
  );

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-md flex flex-col p-4 max-h-[695px] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-500" />
          Assemblies
        </h2>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={fetchData}
            className="p-2 rounded-full hover:bg-gray-200 transition flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`${
              showAddForm
                ? "bg-gray-400 hover:bg-gray-500"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white rounded px-3 py-1 text-sm transition flex items-center gap-1`}
          >
            {showAddForm ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Assembly Form */}
      {showAddForm && (
        <AddAssemblyCard/>
      )}

      {/* Content */}
      {loading ? (
        <p>Loading...</p>
      ) : filteredAssemblies.length === 0 ? (
        <p className="text-gray-500">No assemblies found.</p>
      ) : (
        <div className="flex flex-col gap-2 pt-2">
          {filteredAssemblies.map((assembly) => (
            <div
              key={assembly.assembly_id}
              className="border border-gray-200 rounded"
            >
              {/* Assembly Header */}
              <div
                onClick={() => toggleAssembly(assembly.assembly_id)}
                className="flex justify-between items-center p-2 cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                  {expandedAssemblies[assembly.assembly_id] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  {assembly.assembly_name || "Unnamed"} (ID:{" "}
                  {assembly.assembly_id})
                </div>
                <div className="text-sm text-gray-500">
                  {assembly.status || "-"}
                </div>
              </div>

              {/* Collapsible Content */}
              {expandedAssemblies[assembly.assembly_id] && (
                <div className="p-2">
                  {buildTree(assembly.assembly_id).length === 0 ? (
                    <div className="text-gray-400 ml-4">No nodes.</div>
                  ) : (
                    buildTree(assembly.assembly_id).map((rootNode) => (
                      <TreeNodeComponent key={rootNode.id} node={rootNode} />
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssemblyTreeCard;
