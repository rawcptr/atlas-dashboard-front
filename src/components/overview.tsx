import { GpuCard } from "./gpuTable";

export default function Overview() {
    return (
        <div className="flex flex-col gap-2.5">
            {/* <MetricRow /> */}
            {/* <LossChart /> */}
            <GpuCard />
        </div>
    );
}
