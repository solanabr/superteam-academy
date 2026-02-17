import type { Node, Edge } from "@xyflow/react";
import type { RoadmapSection, NodeVariant, ResourceLink } from "./types";

const MAIN_X = 350;
const LEFT_X = 50;
const RIGHT_X = 630;
const SUB_LEFT_X = -130;
const SUB_RIGHT_X = 870;
const ITEM_GAP = 65;
const CHILD_GAP = 48;
const SECTION_PADDING = 50;

function sectionExtent(section: RoadmapSection): number {
  let maxHalf = 60;
  for (const items of [section.left, section.right]) {
    if (!items || items.length === 0) continue;
    const branchHalf = ((items.length - 1) * ITEM_GAP) / 2;
    let childExtra = 0;
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        childExtra = Math.max(
          childExtra,
          ((item.children.length - 1) * CHILD_GAP) / 2,
        );
      }
    }
    maxHalf = Math.max(maxHalf, branchHalf + childExtra);
  }
  return maxHalf;
}

function makeNode(
  id: string,
  label: string,
  variant: NodeVariant,
  x: number,
  y: number,
  description?: string,
  resources?: ResourceLink[],
): Node {
  return {
    id,
    type: "roadmapNode",
    position: { x, y },
    data: { label, variant, description, resources },
  };
}

function makeEdge(
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string,
  className: string,
): Edge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: "straight",
    className,
  };
}

export function buildRoadmapGraph(sections: RoadmapSection[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let y = 0;
  let prevMainId: string | null = null;

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si]!;

    if (si > 0) {
      const prevHalf = sectionExtent(sections[si - 1]!);
      const currHalf = sectionExtent(section);
      y += prevHalf + currHalf + SECTION_PADDING;
    }

    nodes.push(
      makeNode(
        section.id,
        section.title,
        "milestone",
        MAIN_X,
        y,
        section.description,
        section.resources,
      ),
    );

    if (prevMainId) {
      edges.push(
        makeEdge(prevMainId, section.id, "bottom", "top", "main-edge"),
      );
    }
    prevMainId = section.id;

    const leftItems = section.left ?? [];
    for (let i = 0; i < leftItems.length; i++) {
      const item = leftItems[i]!;
      const itemY = y + (i - (leftItems.length - 1) / 2) * ITEM_GAP;

      nodes.push(
        makeNode(
          item.id,
          item.label,
          "topic",
          LEFT_X,
          itemY,
          item.description,
          item.resources,
        ),
      );
      edges.push(
        makeEdge(section.id, item.id, "s-left", "right", "branch-edge"),
      );

      if (item.children) {
        for (let j = 0; j < item.children.length; j++) {
          const child = item.children[j]!;
          const childY =
            itemY + (j - (item.children.length - 1) / 2) * CHILD_GAP;

          nodes.push(
            makeNode(
              child.id,
              child.label,
              "subtopic",
              SUB_LEFT_X,
              childY,
              child.description,
              child.resources,
            ),
          );
          edges.push(
            makeEdge(item.id, child.id, "s-left", "right", "sub-edge"),
          );
        }
      }
    }

    const rightItems = section.right ?? [];
    for (let i = 0; i < rightItems.length; i++) {
      const item = rightItems[i]!;
      const itemY = y + (i - (rightItems.length - 1) / 2) * ITEM_GAP;

      nodes.push(
        makeNode(
          item.id,
          item.label,
          "topic",
          RIGHT_X,
          itemY,
          item.description,
          item.resources,
        ),
      );
      edges.push(
        makeEdge(section.id, item.id, "s-right", "left", "branch-edge"),
      );

      if (item.children) {
        for (let j = 0; j < item.children.length; j++) {
          const child = item.children[j]!;
          const childY =
            itemY + (j - (item.children.length - 1) / 2) * CHILD_GAP;

          nodes.push(
            makeNode(
              child.id,
              child.label,
              "subtopic",
              SUB_RIGHT_X,
              childY,
              child.description,
              child.resources,
            ),
          );
          edges.push(
            makeEdge(item.id, child.id, "s-right", "left", "sub-edge"),
          );
        }
      }
    }
  }

  return { nodes, edges };
}
