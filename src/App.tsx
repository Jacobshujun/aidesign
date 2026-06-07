import {
  Archive,
  Check,
  ChevronRight,
  Crosshair,
  Download,
  ImagePlus,
  Layers3,
  Library,
  Maximize2,
  Move,
  PanelRight,
  Plus,
  Replace,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { extractDetectedObjects, fetchProviderStatus, requestSceneRecognition } from "./api";
import { detectedObjects, furnitureAssets, initialJobs, initialScenes } from "./data";
import type {
  DetectedObject,
  FurnitureAsset,
  ProviderStatus,
  ReplacementJob,
  SceneLayer,
  SceneReplacement,
  SceneSource,
  WorkspaceView
} from "./types";

const categories = ["全部", "沙发", "单椅", "茶几", "床", "柜子", "灯具"];
const editableCategories = categories.filter((item) => item !== "全部");
const styles = ["全部", "现代", "复古", "北欧", "意式", "侘寂"];
const statuses = ["全部", "ready", "draft", "review", "needs_cutout"];

const statusLabel: Record<FurnitureAsset["status"], string> = {
  ready: "可替换",
  draft: "待标注",
  review: "待审核",
  needs_cutout: "需抠图"
};

const statusTone: Record<FurnitureAsset["status"], string> = {
  ready: "good",
  draft: "draft",
  review: "warn",
  needs_cutout: "hold"
};

const sceneStatusLabel: Record<SceneSource["status"], string> = {
  sample: "示例",
  unrecognized: "待识别",
  recognized: "已识别",
  generated: "已生成"
};

const sceneStatusTone: Record<SceneSource["status"], string> = {
  sample: "draft",
  unrecognized: "hold",
  recognized: "good",
  generated: "warn"
};

const statusHint: Record<FurnitureAsset["status"], string> = {
  ready: "可直接生成",
  draft: "可生成，需补标注",
  review: "可生成，需复核",
  needs_cutout: "可生成，边缘需复核"
};

const statusBoost: Record<FurnitureAsset["status"], number> = {
  ready: 12,
  needs_cutout: 6,
  draft: 4,
  review: 2
};

const layerLabels: Record<SceneLayer, string> = {
  source: "原图",
  detect: "识别",
  replace: "试替换",
  result: "AI结果"
};

const CANVAS_STAGE_WIDTH = 1280;
const CANVAS_STAGE_HEIGHT = 760;
const MIN_CANVAS_SCALE = 0.28;
const MAX_CANVAS_SCALE = 2.8;
const resizeHandles = ["nw", "ne", "sw", "se"] as const;

type CanvasView = {
  x: number;
  y: number;
  scale: number;
};

type ResizeHandle = (typeof resizeHandles)[number];

type CanvasDrag =
  | {
      kind: "pan";
      startClientX: number;
      startClientY: number;
      startView: CanvasView;
    }
  | {
      kind: "move" | "resize";
      handle?: ResizeHandle;
      object: DetectedObject;
      startClientX: number;
      startClientY: number;
      startScale: number;
    };

function resolveSceneStatus(objectCount: number, replacementCount: number): SceneSource["status"] {
  if (replacementCount > 0) {
    return "generated";
  }

  return objectCount > 0 ? "recognized" : "unrecognized";
}

function getReplacementScore(asset: FurnitureAsset, object: DetectedObject, fusion: number, lightLock: number) {
  return Math.min(99, Math.round((asset.quality + object.confidence * 100 + fusion + lightLock) / 4));
}

function sortReplacementCandidates(assets: FurnitureAsset[], selectedObject?: DetectedObject) {
  return [...assets].sort((first, second) => {
    const firstScore =
      first.quality +
      statusBoost[first.status] +
      (selectedObject && first.category === selectedObject.category ? 100 : 0);
    const secondScore =
      second.quality +
      statusBoost[second.status] +
      (selectedObject && second.category === selectedObject.category ? 100 : 0);

    if (secondScore !== firstScore) {
      return secondScore - firstScore;
    }

    return first.title.localeCompare(second.title, "zh-Hans-CN");
  });
}

function clampValue(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function clampCanvasScale(scale: number) {
  return clampValue(scale, MIN_CANVAS_SCALE, MAX_CANVAS_SCALE);
}

function getFittedCanvasView(viewport?: HTMLDivElement | null): CanvasView {
  const width = viewport?.clientWidth ?? 900;
  const height = viewport?.clientHeight ?? 620;
  const scale = clampCanvasScale(
    Math.min((width - 96) / CANVAS_STAGE_WIDTH, (height - 96) / CANVAS_STAGE_HEIGHT, 1)
  );

  return {
    x: Math.round((width - CANVAS_STAGE_WIDTH * scale) / 2),
    y: Math.round((height - CANVAS_STAGE_HEIGHT * scale) / 2),
    scale
  };
}

function zoomCanvasAtPoint(view: CanvasView, scale: number, originX: number, originY: number): CanvasView {
  const nextScale = clampCanvasScale(scale);
  const stageX = (originX - view.x) / view.scale;
  const stageY = (originY - view.y) / view.scale;

  return {
    x: originX - stageX * nextScale,
    y: originY - stageY * nextScale,
    scale: nextScale
  };
}

function getDraggedObject(drag: Extract<CanvasDrag, { kind: "move" | "resize" }>, clientX: number, clientY: number) {
  const deltaX = ((clientX - drag.startClientX) / (CANVAS_STAGE_WIDTH * drag.startScale)) * 100;
  const deltaY = ((clientY - drag.startClientY) / (CANVAS_STAGE_HEIGHT * drag.startScale)) * 100;
  const nextObject = { ...drag.object };

  if (drag.kind === "move") {
    nextObject.x = drag.object.x + deltaX;
    nextObject.y = drag.object.y + deltaY;
    return normalizeDetectedObject(nextObject);
  }

  if (drag.handle?.includes("w")) {
    nextObject.x = drag.object.x + deltaX;
    nextObject.width = drag.object.width - deltaX;
  }

  if (drag.handle?.includes("e")) {
    nextObject.width = drag.object.width + deltaX;
  }

  if (drag.handle?.includes("n")) {
    nextObject.y = drag.object.y + deltaY;
    nextObject.height = drag.object.height - deltaY;
  }

  if (drag.handle?.includes("s")) {
    nextObject.height = drag.object.height + deltaY;
  }

  return normalizeDetectedObject(nextObject);
}

function App() {
  const [view, setView] = useState<WorkspaceView>("workspace");
  const [assets, setAssets] = useState<FurnitureAsset[]>(furnitureAssets);
  const [scenes, setScenes] = useState<SceneSource[]>(initialScenes);
  const [jobs, setJobs] = useState<ReplacementJob[]>(initialJobs);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [style, setStyle] = useState("全部");
  const [status, setStatus] = useState("全部");
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0].id);
  const [selectedSceneId, setSelectedSceneId] = useState(initialScenes[0].id);
  const [selectedObjectId, setSelectedObjectId] = useState(detectedObjects[0].id);
  const [sceneObjectsById, setSceneObjectsById] = useState<Record<string, DetectedObject[]>>({
    [initialScenes[0].id]: detectedObjects
  });
  const [layer, setLayer] = useState<SceneLayer>("detect");
  const [replacementsBySceneId, setReplacementsBySceneId] = useState<Record<string, SceneReplacement[]>>({});
  const [fusion, setFusion] = useState(72);
  const [lightLock, setLightLock] = useState(88);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>();
  const [providerError, setProviderError] = useState("");
  const [aiNotice, setAiNotice] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const sceneInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isActive = true;

    fetchProviderStatus()
      .then((status) => {
        if (isActive) {
          setProviderStatus(status);
          setProviderError("");
        }
      })
      .catch((error: Error) => {
        if (isActive) {
          setProviderError(error.message);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const selectedScene = scenes.find((item) => item.id === selectedSceneId) ?? scenes[0];
  const objects = sceneObjectsById[selectedScene.id] ?? [];
  const selectedObject = objects.find((item) => item.id === selectedObjectId);
  const selectedAsset = assets.find((item) => item.id === selectedAssetId) ?? assets[0];
  const sceneReplacements = replacementsBySceneId[selectedScene.id] ?? [];
  const selectedReplacement = sceneReplacements.find((item) => item.objectId === selectedObjectId);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesQuery =
        !normalizedQuery ||
        [asset.title, asset.category, asset.style, asset.material, asset.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory = category === "全部" || asset.category === category;
      const matchesStyle = style === "全部" || asset.style === style;
      const matchesStatus = status === "全部" || asset.status === status;
      return matchesQuery && matchesCategory && matchesStyle && matchesStatus;
    });
  }, [assets, category, query, status, style]);

  const replacementCandidates = useMemo(() => {
    return sortReplacementCandidates(assets, selectedObject);
  }, [assets, selectedObject]);

  const saveSceneObjects = (nextObjects: DetectedObject[]) => {
    const nextObjectById = new Map(nextObjects.map((object) => [object.id, object]));
    const nextReplacements = sceneReplacements
      .filter((replacement) => nextObjectById.has(replacement.objectId))
      .map((replacement) => ({
        ...replacement,
        objectLabel: nextObjectById.get(replacement.objectId)?.label ?? replacement.objectLabel
      }));
    const nextStatus = resolveSceneStatus(nextObjects.length, nextReplacements.length);

    setSceneObjectsById((current) => ({
      ...current,
      [selectedScene.id]: nextObjects
    }));
    setReplacementsBySceneId((current) => ({
      ...current,
      [selectedScene.id]: nextReplacements
    }));
    setScenes((current) =>
      current.map((scene) =>
        scene.id === selectedScene.id
          ? { ...scene, status: nextStatus, objectCount: nextObjects.length, updatedAt: "刚刚" }
          : scene
      )
    );
    if (nextReplacements.length === 0 && layer === "result") {
      setLayer(nextObjects.length > 0 ? "detect" : "source");
    }
  };

  const selectScene = (sceneId: string) => {
    const nextObjects = sceneObjectsById[sceneId] ?? [];
    const nextReplacements = replacementsBySceneId[sceneId] ?? [];
    setSelectedSceneId(sceneId);
    setSelectedObjectId(nextObjects[0]?.id ?? "");
    setLayer(nextReplacements.length > 0 ? "result" : nextObjects.length > 0 ? "detect" : "source");
    setAiNotice("");
  };

  const handleSceneUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const sceneId = `scene-${Date.now()}`;
    const objectUrl = URL.createObjectURL(file);
    const nextScene: SceneSource = {
      id: sceneId,
      title: file.name.replace(/\.[^.]+$/, "") || "未命名场景",
      image: objectUrl,
      status: "unrecognized",
      objectCount: 0,
      updatedAt: "刚刚"
    };

    setScenes((current) => [nextScene, ...current]);
    setSceneObjectsById((current) => ({ ...current, [sceneId]: [] }));
    setSelectedSceneId(sceneId);
    setSelectedObjectId("");
    setView("workspace");
    setLayer("source");
    setAiNotice("场景图已导入，等待 AI 识别或手动新增识别框");

    readFileAsDataUrl(file)
      .then((dataUrl) => {
        setScenes((current) =>
          current.map((scene) => (scene.id === sceneId ? { ...scene, imageDataUrl: dataUrl } : scene))
        );
      })
      .catch((error: Error) => setAiNotice(error.message));

    event.target.value = "";
  };

  const handleAssetUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const uploadedAsset: FurnitureAsset = {
      id: `upload-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, "") || "未命名单品",
      category: "待标注",
      style: "待标注",
      material: "待标注",
      colorName: "待标注",
      colorHex: "#8f8a7d",
      size: "待标注",
      status: "draft",
      quality: 50,
      usage: 0,
      tags: ["新上传", "待标注"],
      image: URL.createObjectURL(file)
    };

    setAssets((current) => [uploadedAsset, ...current]);
    setSelectedAssetId(uploadedAsset.id);
    setQuery("");
    setCategory("全部");
    setStyle("全部");
    setStatus("draft");
    setView("library");
    event.target.value = "";
  };

  const addObject = () => {
    const newObject: DetectedObject = {
      id: `manual-${Date.now()}`,
      label: "新识别对象",
      category: "单椅",
      confidence: 0.72,
      x: 42,
      y: 42,
      width: 18,
      height: 18
    };

    saveSceneObjects([...objects, newObject]);
    setSelectedObjectId(newObject.id);
    setLayer("detect");
    setAiNotice("已新增识别框，可在右侧调整名称、品类和位置");
  };

  const updateObject = (objectId: string, patch: Partial<DetectedObject>) => {
    const nextObjects = objects.map((object) =>
      object.id === objectId ? normalizeDetectedObject({ ...object, ...patch }) : object
    );
    saveSceneObjects(nextObjects);
  };

  const removeObject = (objectId: string) => {
    const nextObjects = objects.filter((object) => object.id !== objectId);
    saveSceneObjects(nextObjects);
    setSelectedObjectId(nextObjects[0]?.id ?? "");
    setAiNotice("已删除识别框");
  };

  const generatePreview = () => {
    if (!selectedObject) {
      setAiNotice("请先选择或新增识别框");
      return;
    }

    const score = getReplacementScore(selectedAsset, selectedObject, fusion, lightLock);
    const nextReplacement: SceneReplacement = {
      id: `replacement-${Date.now()}`,
      sceneId: selectedScene.id,
      objectId: selectedObject.id,
      objectLabel: selectedObject.label,
      assetId: selectedAsset.id,
      assetTitle: selectedAsset.title,
      assetImage: selectedAsset.image,
      assetStatus: selectedAsset.status,
      timestamp: "刚刚",
      score,
      fusion,
      lightLock
    };
    const nextJob: ReplacementJob = {
      id: `job-${Date.now()}`,
      sceneTitle: selectedScene.title,
      objectLabel: selectedObject.label,
      assetTitle: selectedAsset.title,
      timestamp: "刚刚",
      score
    };

    setReplacementsBySceneId((current) => {
      const currentSceneReplacements = current[selectedScene.id] ?? [];
      const nextSceneReplacements = [
        nextReplacement,
        ...currentSceneReplacements.filter((replacement) => replacement.objectId !== selectedObject.id)
      ];

      return {
        ...current,
        [selectedScene.id]: nextSceneReplacements
      };
    });
    setJobs((current) => [nextJob, ...current]);
    setScenes((current) =>
      current.map((scene) =>
        scene.id === selectedScene.id
          ? { ...scene, status: "generated", objectCount: objects.length, updatedAt: "刚刚" }
          : scene
      )
    );
    setLayer("result");
    setAiNotice(`${selectedObject.label} 已加入替换链，可继续选择下一个单品`);
  };

  const recognizeScene = async () => {
    setIsRecognizing(true);
    setAiNotice("");

    try {
      const response = await requestSceneRecognition({
        imageDataUrl: selectedScene.imageDataUrl,
        instruction: `识别${selectedScene.title}中的可替换家具单品。`
      });
      const recognizedObjects = extractDetectedObjects(response);
      if (recognizedObjects) {
        saveSceneObjects(recognizedObjects);
        setSelectedObjectId(recognizedObjects[0]?.id ?? "");
        setLayer(recognizedObjects.length > 0 ? "detect" : "source");
        setAiNotice(`已更新 ${recognizedObjects.length} 个识别对象`);
      } else {
        setAiNotice("模型已返回结果，等待字段映射确认");
      }
    } catch (error) {
      setAiNotice(error instanceof Error ? error.message : "模型识别请求失败");
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <main className="app-shell">
      <input ref={sceneInputRef} className="hidden-input" type="file" accept="image/*" onChange={handleSceneUpload} />
      <input ref={assetInputRef} className="hidden-input" type="file" accept="image/*" onChange={handleAssetUpload} />

      <aside className="rail" aria-label="主导航">
        <div className="brand-mark">AD</div>
        <button className={view === "workspace" ? "rail-button active" : "rail-button"} onClick={() => setView("workspace")} title="工作台" aria-label="工作台">
          <Layers3 size={20} />
        </button>
        <button className={view === "library" ? "rail-button active" : "rail-button"} onClick={() => setView("library")} title="素材库" aria-label="素材库">
          <Library size={20} />
        </button>
        <button className={view === "tasks" ? "rail-button active" : "rail-button"} onClick={() => setView("tasks")} title="任务记录" aria-label="任务记录">
          <Archive size={20} />
        </button>
      </aside>

      <section className="app-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI FURNITURE STUDIO</p>
            <h1>{view === "workspace" ? "场景替换工作台" : view === "library" ? "家具单品素材库" : "生成任务记录"}</h1>
          </div>
          <ModelStatusBar status={providerStatus} error={providerError} />
          <div className="topbar-actions">
            {view === "workspace" && (
              <>
                <button className="soft-button" onClick={() => sceneInputRef.current?.click()}>
                  <ImagePlus size={17} />
                  导入场景图
                </button>
                <button className="primary-button" onClick={generatePreview} disabled={!selectedObject}>
                  <Sparkles size={17} />
                  生成预览
                </button>
              </>
            )}
            {view === "library" && (
              <button className="primary-button" onClick={() => assetInputRef.current?.click()}>
                <Upload size={17} />
                导入家具单品
              </button>
            )}
            {view === "tasks" && (
              <button className="soft-button" onClick={() => setView("workspace")}>
                <Replace size={16} />
                回到工作台
              </button>
            )}
          </div>
        </header>

        {view === "workspace" && (
          <Workspace
            scene={selectedScene}
            scenes={scenes}
            selectScene={selectScene}
            openSceneUpload={() => sceneInputRef.current?.click()}
            objects={objects}
            selectedObject={selectedObject}
            selectedObjectId={selectedObjectId}
            setSelectedObjectId={setSelectedObjectId}
            selectedAsset={selectedAsset}
            selectedAssetId={selectedAssetId}
            setSelectedAssetId={setSelectedAssetId}
            candidates={replacementCandidates}
            sceneReplacements={sceneReplacements}
            selectedReplacement={selectedReplacement}
            layer={layer}
            setLayer={setLayer}
            fusion={fusion}
            lightLock={lightLock}
            setFusion={setFusion}
            setLightLock={setLightLock}
            generatePreview={generatePreview}
            recognizeScene={recognizeScene}
            isRecognizing={isRecognizing}
            aiNotice={aiNotice}
            addObject={addObject}
            updateObject={updateObject}
            removeObject={removeObject}
          />
        )}

        {view === "library" && (
          <LibraryView
            assets={filteredAssets}
            selectedAsset={selectedAsset}
            selectedAssetId={selectedAssetId}
            setSelectedAssetId={setSelectedAssetId}
            query={query}
            setQuery={setQuery}
            category={category}
            setCategory={setCategory}
            style={style}
            setStyle={setStyle}
            status={status}
            setStatus={setStatus}
          />
        )}

        {view === "tasks" && (
          <TaskView jobs={jobs} scenes={scenes} replacementsBySceneId={replacementsBySceneId} setView={setView} />
        )}
      </section>
    </main>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

function clampPercent(value: number, min = 0, max = 100) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function normalizeDetectedObject(object: DetectedObject): DetectedObject {
  const width = clampPercent(object.width, 4, 96);
  const height = clampPercent(object.height, 4, 96);

  return {
    ...object,
    confidence: clampPercent(object.confidence, 0, 1),
    width,
    height,
    x: clampPercent(object.x, 0, 100 - width),
    y: clampPercent(object.y, 0, 100 - height)
  };
}

function ModelStatusBar({ status, error }: { status?: ProviderStatus; error: string }) {
  if (error) {
    return <div className="model-status error">模型服务未连接</div>;
  }

  return (
    <div className="model-status">
      <span className={status?.textModel.configured ? "status-dot good" : "status-dot hold"} />
      文本模型 {status?.textModel.configured ? "已配置" : "待配置"}
      <span className={status?.runningHub.configured ? "status-dot good" : "status-dot hold"} />
      图生图 {status?.runningHub.configured ? "已配置" : "待配置"}
    </div>
  );
}

type WorkspaceProps = {
  scene: SceneSource;
  scenes: SceneSource[];
  selectScene: (id: string) => void;
  openSceneUpload: () => void;
  objects: DetectedObject[];
  selectedObject?: DetectedObject;
  selectedObjectId: string;
  setSelectedObjectId: (id: string) => void;
  selectedAsset: FurnitureAsset;
  selectedAssetId: string;
  setSelectedAssetId: (id: string) => void;
  candidates: FurnitureAsset[];
  sceneReplacements: SceneReplacement[];
  selectedReplacement?: SceneReplacement;
  layer: SceneLayer;
  setLayer: (layer: SceneLayer) => void;
  fusion: number;
  lightLock: number;
  setFusion: (value: number) => void;
  setLightLock: (value: number) => void;
  generatePreview: () => void;
  recognizeScene: () => void;
  isRecognizing: boolean;
  aiNotice: string;
  addObject: () => void;
  updateObject: (id: string, patch: Partial<DetectedObject>) => void;
  removeObject: (id: string) => void;
};

function Workspace({
  scene,
  scenes,
  selectScene,
  openSceneUpload,
  objects,
  selectedObject,
  selectedObjectId,
  setSelectedObjectId,
  selectedAsset,
  selectedAssetId,
  setSelectedAssetId,
  candidates,
  sceneReplacements,
  selectedReplacement,
  layer,
  setLayer,
  fusion,
  lightLock,
  setFusion,
  setLightLock,
  generatePreview,
  recognizeScene,
  isRecognizing,
  aiNotice,
  addObject,
  updateObject,
  removeObject
}: WorkspaceProps) {
  const [hoveredAssetId, setHoveredAssetId] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<CanvasDrag | null>(null);
  const [canvasView, setCanvasView] = useState<CanvasView>(() => getFittedCanvasView());
  const [isPanning, setIsPanning] = useState(false);
  const [draggingObjectId, setDraggingObjectId] = useState("");
  const replacementsByObjectId = useMemo(
    () => new Map(sceneReplacements.map((replacement) => [replacement.objectId, replacement])),
    [sceneReplacements]
  );
  const replacedObjectIds = useMemo(
    () => new Set(sceneReplacements.map((replacement) => replacement.objectId)),
    [sceneReplacements]
  );
  const nextPendingObject = objects.find((object) => !replacedObjectIds.has(object.id));
  const chainProgress = objects.length > 0 ? `${sceneReplacements.length}/${objects.length}` : "0/0";
  const previewAsset = candidates.find((asset) => asset.id === hoveredAssetId) ?? selectedAsset;

  useEffect(() => {
    setCanvasView(getFittedCanvasView(viewportRef.current));
  }, [scene.id]);

  const selectObject = (objectId: string) => {
    setSelectedObjectId(objectId);
    if (layer === "source") {
      setLayer("detect");
    }
  };

  const selectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    setHoveredAssetId("");
    if (selectedObject) {
      setLayer("replace");
    }
  };

  const selectChainItem = (replacement: SceneReplacement) => {
    setSelectedObjectId(replacement.objectId);
    setSelectedAssetId(replacement.assetId);
    setLayer("result");
  };

  const continueChain = () => {
    if (!nextPendingObject) {
      setLayer("result");
      return;
    }

    setSelectedObjectId(nextPendingObject.id);
    setLayer("detect");
  };

  const fitCanvas = () => {
    setCanvasView(getFittedCanvasView(viewportRef.current));
  };

  const resetCanvas = () => {
    const viewport = viewportRef.current;
    const width = viewport?.clientWidth ?? 900;
    const height = viewport?.clientHeight ?? 620;

    setCanvasView({
      x: Math.round((width - CANVAS_STAGE_WIDTH) / 2),
      y: Math.round((height - CANVAS_STAGE_HEIGHT) / 2),
      scale: 1
    });
  };

  const zoomCanvas = (direction: 1 | -1) => {
    const viewport = viewportRef.current;
    const originX = viewport ? viewport.clientWidth / 2 : 450;
    const originY = viewport ? viewport.clientHeight / 2 : 310;

    setCanvasView((current) => zoomCanvasAtPoint(current, current.scale * (direction > 0 ? 1.16 : 0.86), originX, originY));
  };

  const focusSelectedObject = () => {
    if (!selectedObject) {
      return;
    }

    const viewport = viewportRef.current;
    const viewportWidth = viewport?.clientWidth ?? 900;
    const viewportHeight = viewport?.clientHeight ?? 620;
    const scale = clampCanvasScale(Math.max(canvasView.scale, 1.12));
    const objectCenterX = ((selectedObject.x + selectedObject.width / 2) / 100) * CANVAS_STAGE_WIDTH;
    const objectCenterY = ((selectedObject.y + selectedObject.height / 2) / 100) * CANVAS_STAGE_HEIGHT;

    setCanvasView({
      x: viewportWidth / 2 - objectCenterX * scale,
      y: viewportHeight / 2 - objectCenterY * scale,
      scale
    });
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const originX = event.clientX - rect.left;
    const originY = event.clientY - rect.top;
    const nextScaleMultiplier = event.deltaY > 0 ? 0.9 : 1.1;

    setCanvasView((current) => zoomCanvasAtPoint(current, current.scale * nextScaleMultiplier, originX, originY));
  };

  const beginCanvasPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      kind: "pan",
      startClientX: event.clientX,
      startClientY: event.clientY,
      startView: canvasView
    };
    setIsPanning(true);
  };

  const beginObjectMove = (event: React.PointerEvent<HTMLButtonElement>, object: DetectedObject) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    viewportRef.current?.setPointerCapture(event.pointerId);
    selectObject(object.id);
    dragRef.current = {
      kind: "move",
      object,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScale: canvasView.scale
    };
    setDraggingObjectId(object.id);
  };

  const beginObjectResize = (
    event: React.PointerEvent<HTMLSpanElement>,
    object: DetectedObject,
    handle: ResizeHandle
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    viewportRef.current?.setPointerCapture(event.pointerId);
    selectObject(object.id);
    dragRef.current = {
      kind: "resize",
      handle,
      object,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScale: canvasView.scale
    };
    setDraggingObjectId(object.id);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }

    if (drag.kind === "pan") {
      setCanvasView({
        ...drag.startView,
        x: drag.startView.x + event.clientX - drag.startClientX,
        y: drag.startView.y + event.clientY - drag.startClientY
      });
      return;
    }

    const nextObject = getDraggedObject(drag, event.clientX, event.clientY);
    updateObject(drag.object.id, nextObject);
  };

  const finishCanvasDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
    setIsPanning(false);
    setDraggingObjectId("");
  };

  return (
    <div className="workspace-grid">
      <section className="side-panel">
        <div className="panel-heading">
          <span>历史场景</span>
          <strong>{scenes.length}</strong>
        </div>
        <button className="wide-soft" onClick={openSceneUpload}>
          <ImagePlus size={17} />
          导入场景图
        </button>
        <div className="scene-list">
          {scenes.map((item) => (
            <button
              key={item.id}
              className={item.id === scene.id ? "scene-card active" : "scene-card"}
              onClick={() => selectScene(item.id)}
            >
              <img src={item.image} alt={item.title} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.objectCount} 个对象 / {item.updatedAt}</small>
              </span>
              <em className={`status-pill compact ${sceneStatusTone[item.status]}`}>{sceneStatusLabel[item.status]}</em>
            </button>
          ))}
        </div>

        <div className="panel-divider" />

        <div className="panel-heading">
          <span>识别对象</span>
          <strong>{objects.length}</strong>
        </div>
        <div className="panel-actions">
          <button className="wide-soft" onClick={recognizeScene} disabled={isRecognizing}>
            <Sparkles size={17} />
            {isRecognizing ? "识别中" : "AI 识别"}
          </button>
          <button className="wide-soft" onClick={addObject}>
            <Plus size={17} />
            手动新增
          </button>
        </div>
        {aiNotice && <p className="ai-notice">{aiNotice}</p>}
        <div className="object-list">
          {objects.map((object) => {
            const isReplaced = replacedObjectIds.has(object.id);

            return (
              <button
                key={object.id}
                className={[
                  "object-row",
                  object.id === selectedObjectId ? "active" : "",
                  isReplaced ? "completed" : ""
                ].filter(Boolean).join(" ")}
                onClick={() => selectObject(object.id)}
              >
                <span>
                  <strong>{object.label}</strong>
                  <small>{Math.round(object.confidence * 100)}% / {object.category}{isReplaced ? " / 已替换" : ""}</small>
                </span>
                {isReplaced ? <Check size={17} /> : <ChevronRight size={17} />}
              </button>
            );
          })}
        </div>
        {objects.length === 0 && (
          <div className="empty-state">
            <strong>暂无识别框</strong>
            <span>导入场景后，可 AI 识别或手动新增对象框。</span>
          </div>
        )}
        <div className="metric-strip">
          <div>
            <span>素材命中</span>
            <strong>{candidates.length}</strong>
          </div>
          <div>
            <span>已替换</span>
            <strong>{chainProgress}</strong>
          </div>
        </div>
      </section>

      <section className="canvas-panel">
        <div className="canvas-toolbar">
          <div className="segmented">
            {(["source", "detect", "replace", "result"] as SceneLayer[]).map((item) => (
              <button key={item} className={layer === item ? "active" : ""} onClick={() => setLayer(item)}>
                {layerLabels[item]}
              </button>
            ))}
          </div>
          <div className="canvas-mode-badge">
            <Move size={15} />
            <span>无限画布</span>
            <strong>{Math.round(canvasView.scale * 100)}%</strong>
          </div>
          <div className="toolbar-icons">
            <button className="icon-button mini" title="放大" aria-label="放大" onClick={() => zoomCanvas(1)}>
              <ZoomIn size={16} />
            </button>
            <button className="icon-button mini" title="缩小" aria-label="缩小" onClick={() => zoomCanvas(-1)}>
              <ZoomOut size={16} />
            </button>
            <button className="icon-button mini" title="聚焦对象" aria-label="聚焦对象" onClick={focusSelectedObject} disabled={!selectedObject}>
              <Crosshair size={16} />
            </button>
            <button className="icon-button mini" title="适配画布" aria-label="适配画布" onClick={fitCanvas}>
              <Maximize2 size={16} />
            </button>
            <button className="icon-button mini" title="重置视图" aria-label="重置视图" onClick={resetCanvas}>
              <RotateCcw size={16} />
            </button>
            <button className="icon-button mini" title="下载" aria-label="下载">
              <Download size={16} />
            </button>
          </div>
        </div>
        <div
          ref={viewportRef}
          className={isPanning ? "canvas-viewport panning" : "canvas-viewport"}
          onPointerDown={beginCanvasPan}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={finishCanvasDrag}
          onPointerCancel={finishCanvasDrag}
          onWheel={handleCanvasWheel}
          aria-label="无限画布工作区"
        >
          <div className="canvas-axis x" />
          <div className="canvas-axis y" />
          <div
            className="canvas-stage"
            style={{
              width: CANVAS_STAGE_WIDTH,
              height: CANVAS_STAGE_HEIGHT,
              transform: `translate3d(${canvasView.x}px, ${canvasView.y}px, 0) scale(${canvasView.scale})`
            }}
          >
            <div
              className={layer === "result" && sceneReplacements.length > 0 ? "canvas-surface generated" : "canvas-surface"}
              style={{ backgroundImage: `url(${scene.image})` }}
            >
              <div className="canvas-vignette" />
              {layer !== "source" && objects.map((object) => {
                const isActive = object.id === selectedObjectId;
                const generatedReplacement = replacementsByObjectId.get(object.id);
                const showTrialReplacement = isActive && layer === "replace";
                const showGeneratedReplacement = layer === "result" && Boolean(generatedReplacement);
                const replacementStyle = showTrialReplacement || showGeneratedReplacement
                  ? {
                      backgroundImage: `linear-gradient(rgba(176, 138, 74, 0.1), rgba(176, 138, 74, 0.1)), url(${
                        showGeneratedReplacement ? generatedReplacement?.assetImage : previewAsset.image
                      })`
                    }
                  : undefined;
                const boxClassName = [
                  "detection-box",
                  isActive ? "active" : "",
                  showGeneratedReplacement ? "replaced" : "",
                  layer === "result" && !generatedReplacement ? "pending" : "",
                  object.id === draggingObjectId ? "dragging" : ""
                ].filter(Boolean).join(" ");

                return (
                  <button
                    key={object.id}
                    className={boxClassName}
                    style={{
                      left: `${object.x}%`,
                      top: `${object.y}%`,
                      width: `${object.width}%`,
                      height: `${object.height}%`,
                      ...replacementStyle
                    }}
                    onPointerDown={(event) => beginObjectMove(event, object)}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectObject(object.id);
                    }}
                    title="拖动移动，拖拽角点缩放"
                  >
                    <span className="box-label">
                      {showGeneratedReplacement
                        ? generatedReplacement?.assetTitle
                        : showTrialReplacement
                          ? previewAsset.title
                          : object.label}
                    </span>
                    {isActive && resizeHandles.map((handle) => (
                      <span
                        key={handle}
                        className={`resize-handle ${handle}`}
                        onPointerDown={(event) => beginObjectResize(event, object, handle)}
                        aria-hidden="true"
                      />
                    ))}
                  </button>
                );
              })}
              {objects.length === 0 && (
                <div className="canvas-empty">
                  <strong>{scene.title}</strong>
                  <span>等待识别框</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="replace-panel">
        <div className="panel-heading">
          <span>替换面板</span>
          <strong>{selectedObject?.category ?? "未选择"}</strong>
        </div>

        {selectedObject ? (
          <>
            <article className="selected-target">
              <div>
                <small>{selectedReplacement ? "当前对象 / 已在链中" : "当前对象"}</small>
                <h2>{selectedObject.label}</h2>
              </div>
              <span>{selectedReplacement ? selectedReplacement.score : Math.round(selectedObject.confidence * 100)}%</span>
            </article>

            <div className="edit-card">
              <label className="form-row">
                <span>名称</span>
                <input value={selectedObject.label} onChange={(event) => updateObject(selectedObject.id, { label: event.target.value })} />
              </label>
              <label className="form-row">
                <span>品类</span>
                <select value={selectedObject.category} onChange={(event) => updateObject(selectedObject.id, { category: event.target.value })}>
                  {editableCategories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <div className="box-field-grid">
                <NumberField label="X" value={selectedObject.x} min={0} max={100 - selectedObject.width} onChange={(value) => updateObject(selectedObject.id, { x: value })} />
                <NumberField label="Y" value={selectedObject.y} min={0} max={100 - selectedObject.height} onChange={(value) => updateObject(selectedObject.id, { y: value })} />
                <NumberField label="宽" value={selectedObject.width} min={4} max={96} onChange={(value) => updateObject(selectedObject.id, { width: value })} />
                <NumberField label="高" value={selectedObject.height} min={4} max={96} onChange={(value) => updateObject(selectedObject.id, { height: value })} />
              </div>
              <button className="danger-button" onClick={() => removeObject(selectedObject.id)}>
                <Trash2 size={16} />
                删除识别框
              </button>
            </div>

            <div className="section-label">
              <span>替换素材</span>
              <strong>全部状态可生成</strong>
            </div>
            <div className="candidate-stack">
              {candidates.map((asset) => (
                <button
                  key={asset.id}
                  className={asset.id === selectedAssetId ? "candidate active" : "candidate"}
                  onClick={() => selectAsset(asset.id)}
                  onFocus={() => {
                    setHoveredAssetId(asset.id);
                    if (selectedObject) {
                      setLayer("replace");
                    }
                  }}
                  onBlur={() => setHoveredAssetId("")}
                  onMouseEnter={() => {
                    setHoveredAssetId(asset.id);
                    if (selectedObject) {
                      setLayer("replace");
                    }
                  }}
                  onMouseLeave={() => setHoveredAssetId("")}
                >
                  <img src={asset.image} alt={asset.title} />
                  <span className="candidate-copy">
                    <strong>{asset.title}</strong>
                    <small>{asset.category} / {asset.style} / {asset.material}</small>
                    <span className="candidate-meta">
                      <em className={`status-pill compact inline ${statusTone[asset.status]}`}>{statusLabel[asset.status]}</em>
                      <small>{statusHint[asset.status]}</small>
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="control-cluster">
              <SliderRow icon={<SlidersHorizontal size={16} />} label="融合强度" value={fusion} setValue={setFusion} />
              <SliderRow icon={<Settings2 size={16} />} label="光影锁定" value={lightLock} setValue={setLightLock} />
            </div>

            <ReplacementChain
              replacements={sceneReplacements}
              selectedReplacement={selectedReplacement}
              nextPendingObject={nextPendingObject}
              onSelectReplacement={selectChainItem}
              onContinue={continueChain}
            />
          </>
        ) : (
          <div className="empty-state tall">
            <strong>先选择一个识别框</strong>
            <span>可以从左侧对象列表选择，也可以手动新增家具框。</span>
          </div>
        )}

        <button className="wide-primary" onClick={generatePreview} disabled={!selectedObject}>
          <Wand2 size={18} />
          {selectedReplacement ? "重新生成并覆盖节点" : "生成替换图"}
        </button>
      </section>
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

function NumberField({ label, value, min, max, onChange }: NumberFieldProps) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step="1"
        value={Math.round(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

type SliderRowProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  setValue: (value: number) => void;
};

function SliderRow({ icon, label, value, setValue }: SliderRowProps) {
  return (
    <label className="slider-row">
      <span>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
      <input type="range" min="0" max="100" value={value} onChange={(event) => setValue(Number(event.target.value))} />
    </label>
  );
}

type ReplacementChainProps = {
  replacements: SceneReplacement[];
  selectedReplacement?: SceneReplacement;
  nextPendingObject?: DetectedObject;
  onSelectReplacement: (replacement: SceneReplacement) => void;
  onContinue: () => void;
};

function ReplacementChain({
  replacements,
  selectedReplacement,
  nextPendingObject,
  onSelectReplacement,
  onContinue
}: ReplacementChainProps) {
  return (
    <div className="replacement-chain">
      <div className="chain-heading">
        <span>连续替换链</span>
        <strong>{replacements.length}</strong>
      </div>
      {replacements.length > 0 ? (
        <div className="chain-list">
          {replacements.map((replacement, index) => (
            <button
              key={replacement.id}
              className={replacement.id === selectedReplacement?.id ? "chain-item active" : "chain-item"}
              onClick={() => onSelectReplacement(replacement)}
            >
              <span className="chain-index">{index + 1}</span>
              <img src={replacement.assetImage} alt={replacement.assetTitle} />
              <span>
                <strong>{replacement.objectLabel}</strong>
                <small>{replacement.assetTitle}</small>
              </span>
              <em>{replacement.score}</em>
            </button>
          ))}
        </div>
      ) : (
        <div className="chain-empty">
          <strong>尚未生成替换节点</strong>
          <span>生成后会在这里串成本场景的连续替换任务链。</span>
        </div>
      )}
      <button className="wide-soft chain-next" onClick={onContinue} disabled={!nextPendingObject}>
        {nextPendingObject ? (
          <>
            <Replace size={16} />
            继续替换：{nextPendingObject.label}
          </>
        ) : (
          <>
            <Check size={16} />
            本场景对象已全部替换
          </>
        )}
      </button>
    </div>
  );
}

type LibraryViewProps = {
  assets: FurnitureAsset[];
  selectedAsset: FurnitureAsset;
  selectedAssetId: string;
  setSelectedAssetId: (id: string) => void;
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  style: string;
  setStyle: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
};

function LibraryView({
  assets,
  selectedAsset,
  selectedAssetId,
  setSelectedAssetId,
  query,
  setQuery,
  category,
  setCategory,
  style,
  setStyle,
  status,
  setStatus
}: LibraryViewProps) {
  return (
    <div className="library-layout">
      <aside className="filter-panel">
        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称、材质、标签" />
        </label>
        <FilterGroup label="品类" options={categories} value={category} setValue={setCategory} />
        <FilterGroup label="风格" options={styles} value={style} setValue={setStyle} />
        <FilterGroup label="状态" options={statuses} value={status} setValue={setStatus} formatter={(item) => item === "全部" ? item : statusLabel[item as FurnitureAsset["status"]]} />
      </aside>

      <section className="asset-grid" aria-label="家具素材列表">
        {assets.map((asset) => (
          <button key={asset.id} className={asset.id === selectedAssetId ? "asset-card active" : "asset-card"} onClick={() => setSelectedAssetId(asset.id)}>
            <img src={asset.image} alt={asset.title} />
            <span className={`status-pill ${statusTone[asset.status]}`}>{statusLabel[asset.status]}</span>
            <div>
              <h2>{asset.title}</h2>
              <p>{asset.category} / {asset.style} / {asset.material}</p>
            </div>
          </button>
        ))}
      </section>

      <aside className="detail-panel">
        <div className="detail-image">
          <img src={selectedAsset.image} alt={selectedAsset.title} />
        </div>
        <div className="detail-title">
          <span className={`status-pill ${statusTone[selectedAsset.status]}`}>{statusLabel[selectedAsset.status]}</span>
          <h2>{selectedAsset.title}</h2>
        </div>
        <dl className="metadata">
          <div>
            <dt>品类</dt>
            <dd>{selectedAsset.category}</dd>
          </div>
          <div>
            <dt>风格</dt>
            <dd>{selectedAsset.style}</dd>
          </div>
          <div>
            <dt>材质</dt>
            <dd>{selectedAsset.material}</dd>
          </div>
          <div>
            <dt>尺寸</dt>
            <dd>{selectedAsset.size}</dd>
          </div>
          <div>
            <dt>质量</dt>
            <dd>{selectedAsset.quality}</dd>
          </div>
          <div>
            <dt>使用</dt>
            <dd>{selectedAsset.usage}</dd>
          </div>
        </dl>
        <div className="swatch-row">
          <span style={{ backgroundColor: selectedAsset.colorHex }} />
          {selectedAsset.colorName}
        </div>
        <div className="tag-row">
          {selectedAsset.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </aside>
    </div>
  );
}

type FilterGroupProps = {
  label: string;
  options: string[];
  value: string;
  setValue: (value: string) => void;
  formatter?: (value: string) => string;
};

function FilterGroup({ label, options, value, setValue, formatter }: FilterGroupProps) {
  return (
    <fieldset className="filter-group">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button key={option} className={option === value ? "chip active" : "chip"} onClick={() => setValue(option)} type="button">
            {formatter ? formatter(option) : option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

type TaskViewProps = {
  jobs: ReplacementJob[];
  scenes: SceneSource[];
  replacementsBySceneId: Record<string, SceneReplacement[]>;
  setView: (view: WorkspaceView) => void;
};

function TaskView({ jobs, scenes, replacementsBySceneId, setView }: TaskViewProps) {
  const sceneChains = scenes
    .map((scene) => ({
      scene,
      replacements: replacementsBySceneId[scene.id] ?? []
    }))
    .filter((item) => item.replacements.length > 0);
  const totalChainNodes = sceneChains.reduce((total, item) => total + item.replacements.length, 0);

  return (
    <section className="tasks-view">
      <div className="task-table">
        <div className="task-row heading">
          <span>场景</span>
          <span>对象</span>
          <span>替换素材</span>
          <span>时间</span>
          <span>评分</span>
          <span>状态</span>
        </div>
        {jobs.map((job) => (
          <div className="task-row" key={job.id}>
            <span>{job.sceneTitle}</span>
            <span>{job.objectLabel}</span>
            <span>{job.assetTitle}</span>
            <span>{job.timestamp}</span>
            <strong>{job.score}</strong>
            <span className="done-state">
              <Check size={15} />
              已生成
            </span>
          </div>
        ))}
      </div>
      <aside className="task-side">
        <PanelRight size={22} />
        <h2>{jobs.length}</h2>
        <p>已记录任务</p>
        <div className="task-chain-summary">
          <div className="chain-heading">
            <span>场景任务链</span>
            <strong>{totalChainNodes}</strong>
          </div>
          {sceneChains.length > 0 ? (
            <div className="task-chain-list">
              {sceneChains.map(({ scene, replacements }) => (
                <div className="task-chain-card" key={scene.id}>
                  <strong>{scene.title}</strong>
                  <span>{replacements.length} 个替换节点</span>
                  <small>{replacements.map((replacement) => replacement.objectLabel).join(" / ")}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="chain-empty compact">
              <strong>暂无连续替换链</strong>
              <span>在工作台生成后，这里会按场景聚合。</span>
            </div>
          )}
        </div>
        <button className="soft-button" onClick={() => setView("workspace")}>
          <Replace size={16} />
          回到工作台
        </button>
      </aside>
    </section>
  );
}

export default App;
