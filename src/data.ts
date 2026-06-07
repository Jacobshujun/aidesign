import type { DetectedObject, FurnitureAsset, ReplacementJob, SceneSource } from "./types";

export const furnitureAssets: FurnitureAsset[] = [
  {
    id: "sofa-ivory-01",
    title: "月白弧线三人沙发",
    category: "沙发",
    style: "现代",
    material: "羊毛混纺",
    colorName: "月白",
    colorHex: "#e9e1d2",
    size: "2180 x 920 x 760 mm",
    status: "ready",
    quality: 96,
    usage: 42,
    tags: ["客厅", "柔和", "大面积替换"],
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=82"
  },
  {
    id: "chair-olive-01",
    title: "橄榄绿包裹单椅",
    category: "单椅",
    style: "复古",
    material: "绒布",
    colorName: "橄榄绿",
    colorHex: "#63735b",
    size: "780 x 820 x 860 mm",
    status: "ready",
    quality: 91,
    usage: 28,
    tags: ["客厅", "焦点", "暖光"],
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=82"
  },
  {
    id: "table-walnut-01",
    title: "胡桃木圆角茶几",
    category: "茶几",
    style: "北欧",
    material: "胡桃木",
    colorName: "胡桃木",
    colorHex: "#8d5b3d",
    size: "1180 x 620 x 380 mm",
    status: "ready",
    quality: 94,
    usage: 36,
    tags: ["客厅", "木质", "低矮"],
    image: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=900&q=82"
  },
  {
    id: "lamp-brass-01",
    title: "黄铜弯臂落地灯",
    category: "灯具",
    style: "意式",
    material: "黄铜",
    colorName: "黄铜",
    colorHex: "#b08a4a",
    size: "420 x 680 x 1620 mm",
    status: "review",
    quality: 84,
    usage: 13,
    tags: ["客厅", "金属", "氛围"],
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=82"
  },
  {
    id: "bed-linen-01",
    title: "亚麻软包双人床",
    category: "床",
    style: "侘寂",
    material: "亚麻",
    colorName: "砂岩灰",
    colorHex: "#b6aa9a",
    size: "2060 x 2240 x 980 mm",
    status: "needs_cutout",
    quality: 73,
    usage: 8,
    tags: ["卧室", "低饱和", "需抠图"],
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=82"
  },
  {
    id: "cabinet-black-01",
    title: "黑橡木边柜",
    category: "柜子",
    style: "现代",
    material: "黑橡木",
    colorName: "炭黑",
    colorHex: "#26231f",
    size: "1600 x 420 x 780 mm",
    status: "ready",
    quality: 89,
    usage: 21,
    tags: ["餐厅", "收纳", "深色"],
    image: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=900&q=82"
  }
];

export const detectedObjects: DetectedObject[] = [
  {
    id: "object-sofa",
    label: "三人沙发",
    category: "沙发",
    confidence: 0.96,
    x: 18,
    y: 48,
    width: 43,
    height: 26
  },
  {
    id: "object-table",
    label: "茶几",
    category: "茶几",
    confidence: 0.92,
    x: 36,
    y: 72,
    width: 28,
    height: 12
  },
  {
    id: "object-chair",
    label: "单椅",
    category: "单椅",
    confidence: 0.88,
    x: 66,
    y: 50,
    width: 16,
    height: 28
  },
  {
    id: "object-lamp",
    label: "落地灯",
    category: "灯具",
    confidence: 0.81,
    x: 78,
    y: 18,
    width: 8,
    height: 42
  }
];

export const initialJobs: ReplacementJob[] = [
  {
    id: "job-001",
    sceneTitle: "客厅暖光示例",
    objectLabel: "三人沙发",
    assetTitle: "月白弧线三人沙发",
    timestamp: "今日 15:42",
    score: 94
  },
  {
    id: "job-002",
    sceneTitle: "客厅暖光示例",
    objectLabel: "茶几",
    assetTitle: "胡桃木圆角茶几",
    timestamp: "今日 14:18",
    score: 91
  }
];

export const sceneImage =
  "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1600&q=86";

export const initialScenes: SceneSource[] = [
  {
    id: "scene-sample-living",
    title: "客厅暖光示例",
    image: sceneImage,
    status: "sample",
    objectCount: detectedObjects.length,
    updatedAt: "示例场景"
  }
];
