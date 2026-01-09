import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  type DataPointArray,
  GpuData,
  type GpuStats,
  LayerData,
  type LayerStats,
  type StaticMetrics,
  TrainingData,
  type TrainingStats,
  type UpdateableValue,
  WSMessage,
} from "./types/schema";

interface MetricsState {
  connected: boolean;
  layers: Record<number, LayerStats>;
  global: TrainingStats;
  // Map GPU ID -> GPU Stats
  gpu: Record<number, GpuStats>;
  staticInfo: StaticMetrics;
  reducedMotion: boolean;

  setConnected: (status: boolean) => void;
  processMessage: (msg: unknown) => void;
  setReducedMotion: (reduced: boolean) => void;
  reset: () => void;
}
type MetricsForType<T> = {
  [K in keyof T]?: T[K] extends DataPointArray
    ? number | string | null // For arrays, we accept the value to append
    : T[K]; // For non-arrays, accept the same type
};

function updateMetrics<T extends Record<string, UpdateableValue>>(
  prev: T,
  metrics: MetricsForType<T>,
  step: number
): T {
  const next: T = { ...prev };

  for (const [rawKey, value] of Object.entries(metrics)) {
    if (!(rawKey in next) || value === undefined) continue;
    const key = rawKey as keyof T;
    const prevVal = next[key];
    if (Array.isArray(prevVal)) {
      next[key] = [...prevVal, { step, value }] as T[typeof key];
    } else {
      next[key] = value as T[typeof key];
    }
  }

  return next;
}

export const useMetricsStore = create<MetricsState>()(
  devtools((set) => ({
    connected: false,
    layers: {},
    global: TrainingData.parse({}),
    gpu: {},
    staticInfo: {},
    reducedMotion: false,
    setConnected: (status) => set({ connected: status }),
    setReducedMotion: (reduced: boolean) => set({ reducedMotion: reduced }),
    reset: () =>
      set({
        layers: {},
        global: TrainingData.parse({}),
        gpu: {},
        staticInfo: {},
      }),
    processMessage: (rawMsg) => {
      const result = WSMessage.safeParse(rawMsg);
      if (!result.success) {
        console.error("Invalid WS Message:", result.error);
        return;
      }
      const msg = result.data;
      set((state) => {
        switch (msg.type) {
          case "layer_update": {
            const layer = state.layers[msg.layer_id] || LayerData.parse({});
            const nextLayer = updateMetrics(layer, msg.metrics, msg.step);
            return {
              layers: { ...state.layers, [msg.layer_id]: nextLayer },
            };
          }
          case "global_update": {
            const nextGlobal = updateMetrics(
              state.global,
              msg.metrics,
              msg.step
            );
            return { global: nextGlobal };
          }
          case "gpu_update": {
            const gpu = state.gpu[msg.id] || GpuData.parse({});
            const nextGpu = updateMetrics(gpu, msg.metrics, msg.timestamp);
            console.log(`GPU ${msg.id} Update:`, msg.metrics);
            nextGpu.timestamp = msg.timestamp; // keep scalar
            return {
              gpu: { ...state.gpu, [msg.id]: nextGpu },
            };
          }
          case "static_metrics": {
            return { staticInfo: msg.metrics };
          }
          case "reset": {
            console.log("Resetting all metrics");
            return {
              layers: {},
              global: TrainingData.parse({}),
              gpu: {},
              staticInfo: {},
            };
          }
          default:
            return state;
        }
      });
    },
  }))
);
