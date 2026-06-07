export type AssetStatus = "ready" | "draft" | "needs_cutout" | "review";
export type SceneStatus = "sample" | "unrecognized" | "recognized" | "generated";
export type SceneLayer = "source" | "detect" | "replace" | "result";

export type FurnitureAsset = {
  id: string;
  title: string;
  category: string;
  style: string;
  material: string;
  colorName: string;
  colorHex: string;
  size: string;
  status: AssetStatus;
  quality: number;
  usage: number;
  tags: string[];
  image: string;
};

export type DetectedObject = {
  id: string;
  label: string;
  category: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SceneSource = {
  id: string;
  title: string;
  image: string;
  imageDataUrl?: string;
  status: SceneStatus;
  objectCount: number;
  updatedAt: string;
};

export type ReplacementJob = {
  id: string;
  sceneTitle: string;
  objectLabel: string;
  assetTitle: string;
  timestamp: string;
  score: number;
};

export type SceneReplacement = {
  id: string;
  sceneId: string;
  objectId: string;
  objectLabel: string;
  assetId: string;
  assetTitle: string;
  assetImage: string;
  assetStatus: AssetStatus;
  timestamp: string;
  score: number;
  fusion: number;
  lightLock: number;
};

export type WorkspaceView = "workspace" | "library" | "tasks";

export type ProviderStatus = {
  textModel: {
    configured: boolean;
    baseUrl: string;
    model: string;
  };
  runningHub: {
    configured: boolean;
    apiBaseUrl: string;
    webappId: string;
  };
};
