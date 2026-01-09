import { z } from "zod";

const NullableNumber = z.number().nullish();

export const DataPoint = z.object({
  step: z.number(),
  value: z.number(),
});

const DefaultInitArray = z.array(DataPoint).default([]);

export const LayerData = z.object({
  mean: DefaultInitArray,
  stddev: DefaultInitArray,
  absmax: DefaultInitArray,
  grad_norm: DefaultInitArray,
  attn_entropy: DefaultInitArray,
});

export const OptimData = z.object({
  grad_norm: DefaultInitArray,
  update_norm: DefaultInitArray,
  update_ratio: DefaultInitArray,
  effective_lr: DefaultInitArray,
  state_norms: z.record(z.string(), z.array(DataPoint)).default({}),
});

export const TrainingData = z.object({
  loss: DefaultInitArray,
  mfu: DefaultInitArray,
  throughput: DefaultInitArray,
});

export const StaticData = z.object({
  smi_ver: z.string().nullish(),
  cuda_ver: z.string().nullish(),
  driver_ver: z.string().nullish(),
});

export const GpuData = z.object({
  temp: DefaultInitArray, // 0, 1, ...
  perf: z.string().optional().default("N/A"), // "P1" , "P12", etc
  pwr_draw: DefaultInitArray,
  max_pwr: NullableNumber.default(0),
  mem_usg: DefaultInitArray,
  max_mem: NullableNumber.default(0),
  gpu_util: DefaultInitArray,
  timestamp: NullableNumber.default(0),
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
    timestamp: z.number(),
    metrics: z.record(z.string(), z.union([z.number(), z.string(), z.null()])), // {"id": 0, "temp": 48, .. }
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
export type DataPointArray = Array<{ step: number; value: number | string }>;
export type UpdateableValue = DataPointArray | number | string | null;
