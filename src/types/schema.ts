import { z } from "zod";

const NullableNumber = z.number().nullish();

export const DataPoint = z.object({
    step: z.number(),
    value: z.number(),
});

export const LayerData = z.object({
    mean: z.array(DataPoint).default([]),
    stddev: z.array(DataPoint).default([]),
    absmax: z.array(DataPoint).default([]),
    grad_norm: z.array(DataPoint).default([]),
    attn_entropy: z.array(DataPoint).default([]),
});

export const TrainingData = z.object({
    loss: z.array(DataPoint).default([]),
    mfu: z.array(DataPoint).default([]),
    throughput: z.array(DataPoint).default([]),
});

export const StaticData = z.object({
    smi_ver: z.string().nullish(),
    cuda_ver: z.string().nullish(),
    driver_ver: z.string().nullish(),
});

export const GpuData = z.object({
    temp: NullableNumber, // 0, 1, ...
    perf: z.string().optional(), // "P1" , "P12", etc
    pwr_draw: NullableNumber,
    max_pwr: NullableNumber,
    mem_usg: NullableNumber,
    max_mem: NullableNumber,
    gpu_util: NullableNumber,
    timestamp: NullableNumber,
});

export const WSMessage = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("layer_update"),
        layer_id: z.number(),
        step: z.number(),
        metrics: z.record(z.string(), z.number()), // { "mean": 0.5, "std": 1.2, .. }
    }),
    z.object({
        type: z.literal("global_update"),
        step: z.number(),
        metrics: z.record(z.string(), z.number()), // { "loss": 2.4, "mfu": 45.0, .. }
    }),
    z.object({
        type: z.literal("gpu_update"),
        id: z.number(),
        // this could be step, but I think nvidia-smi should run independent
        // of the logging loop. this is mostly for the compute tab so you can see
        // things in more detail
        timestamp: z.number(),
        metrics: z.record(
            z.string(),
            z.union([z.number(), z.string(), z.null()])
        ), // {"id": 0, "temp": 48, .. }
    }),
    z.object({
        type: z.literal("static_metrics"),
        metrics: StaticData,
    }),
    z.object({
        type: z.literal("reset"),
    }),
]);

export type LayerStats = z.infer<typeof LayerData>;
export type TrainingStats = z.infer<typeof TrainingData>;
export type GpuStats = z.infer<typeof GpuData>;
export type StaticMetrics = z.infer<typeof StaticData>;
