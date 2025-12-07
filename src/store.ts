import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
    type GpuStats,
    LayerData,
    type LayerStats,
    type StaticMetrics,
    TrainingData,
    type TrainingStats,
    WSMessage,
} from "./types/schema";

interface MetricsState {
    connected: boolean;
    layers: Record<number, LayerStats>;
    global: TrainingStats;
    // Map GPU ID -> GPU Stats
    gpu: Record<number, GpuStats>;
    staticInfo: StaticMetrics;

    setConnected: (status: boolean) => void;
    processMessage: (msg: unknown) => void;
    reset: () => void;
}

export const useMetricsStore = create<MetricsState>()(
    devtools((set) => ({
        connected: false,
        layers: {},
        global: TrainingData.parse({}),
        gpu: {},
        staticInfo: {},

        setConnected: (status) => set({ connected: status }),

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
                        const { layer_id, step, metrics } = msg;
                        const nextLayer = {
                            ...(state.layers[layer_id] || LayerData.parse({})),
                        };
                        Object.entries(metrics).forEach(([key, value]) => {
                            if (key in nextLayer) {
                                // @ts-expect-error - key access is safe due to schema validation
                                nextLayer[key] = [
                                    // @ts-expect-error - key access is safe due to schema validation
                                    ...nextLayer[key],
                                    { step, value },
                                ];
                            }
                        });

                        return {
                            layers: { ...state.layers, [layer_id]: nextLayer },
                        };
                    }

                    case "global_update": {
                        const { step, metrics } = msg;
                        const nextGlobal = { ...state.global };

                        Object.entries(metrics).forEach(([key, value]) => {
                            if (key in nextGlobal) {
                                // @ts-expect-error - key access is safe
                                nextGlobal[key] = [
                                    // @ts-expect-error - key access is safe due to schema validation
                                    ...nextGlobal[key],
                                    { step, value },
                                ];
                            }
                        });

                        return { global: nextGlobal };
                    }

                    case "gpu_update": {
                        const { id, timestamp, metrics } = msg;
                        const currentGpu = state.gpu[id] || {};
                        const nextGpu = {
                            ...currentGpu,
                            ...metrics,
                            timestamp,
                        };
                        return { gpu: { ...state.gpu, [id]: nextGpu } };
                    }

                    case "static_metrics": {
                        return { staticInfo: msg.metrics };
                    }
                    default:
                        return state;
                }
            });
        },
    }))
);
