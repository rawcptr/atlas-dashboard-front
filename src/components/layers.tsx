import { useParams } from "react-router-dom";
import { LayerChart } from "./layerChart";

export default function Layers() {
  const { id } = useParams();
  if (!id) return null;
  return (
    <div className="flex gap-2.5 flex-col">
      <div className="flex flex-row gap-2.5 flex-wrap basis-1/3 w-full">
        <LayerChart
          layerId={Number(id)}
          metric="mean"
          title="mean"
          className="flex-1 w-full"
        />
        <LayerChart
          layerId={Number(id)}
          metric="stddev"
          title="std. dev"
          className="flex-1"
        />
        <LayerChart
          layerId={Number(id)}
          metric="absmax"
          title="abs. max."
          className="flex-1"
        />
      </div>
      <LayerChart
        layerId={Number(id)}
        metric="attn_entropy"
        title="mean attention entropy"
        style="w-full h-52"
        area={false}
      />
      <LayerChart
        layerId={Number(id)}
        metric="grad_norm"
        title="gradient L2 normalization"
        style="w-full h-52"
        area={false}
      />
    </div>
  );
}
