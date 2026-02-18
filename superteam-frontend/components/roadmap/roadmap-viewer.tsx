"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type ColorMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { RoadmapNode } from "./roadmap-node";
import { RoadmapDetailPanel } from "./roadmap-detail-panel";
import { buildRoadmapGraph } from "@/lib/roadmaps/builder";
import type { RoadmapDef, ResourceLink } from "@/lib/roadmaps/types";

const nodeTypes = { roadmapNode: RoadmapNode };

export function RoadmapViewer({ roadmap }: { roadmap: RoadmapDef }) {
  const { resolvedTheme } = useTheme();
  const { nodes, edges } = useMemo(
    () => buildRoadmapGraph(roadmap.sections),
    [roadmap],
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={(resolvedTheme as ColorMode) ?? "dark"}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background gap={24} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--background) / 0.85)"
        />
      </ReactFlow>

      {selectedNode && (
        <div className="absolute top-0 right-0 h-full w-[380px] z-10 shadow-xl">
          <RoadmapDetailPanel
            data={
              selectedNode.data as {
                label: string;
                variant: string;
                description?: string;
                resources?: ResourceLink[];
              }
            }
            onClose={() => setSelectedNode(null)}
          />
        </div>
      )}
    </div>
  );
}
