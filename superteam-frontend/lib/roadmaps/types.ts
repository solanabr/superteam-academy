export type ResourceLink = {
  type: "course" | "article" | "docs" | "video";
  title: string;
  url: string;
};

export type BranchChild = {
  id: string;
  label: string;
  description?: string;
  resources?: ResourceLink[];
};

export type BranchItem = {
  id: string;
  label: string;
  description?: string;
  resources?: ResourceLink[];
  children?: BranchChild[];
};

export type RoadmapSection = {
  id: string;
  title: string;
  description?: string;
  resources?: ResourceLink[];
  left?: BranchItem[];
  right?: BranchItem[];
};

export type RoadmapDef = {
  slug: string;
  title: string;
  description: string;
  sections: RoadmapSection[];
};

export type NodeVariant = "milestone" | "topic" | "subtopic";
