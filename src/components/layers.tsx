import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useMetricsStore } from "@/store";
import { Separator } from "@radix-ui/react-separator";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { LayerChart } from "./layerChart";

export default function Layers() {
  const layers = useMetricsStore((s) => s.layers);
  const layerIds = Object.keys(layers)
    .map(Number)
    .sort((a, b) => a - b);
  const [selectedLayer, setSelectedLayer] = useState(String(layerIds[0] ?? 0));
  const [open, setOpen] = useState(false);
  const layerOptions = layerIds.map((id) => ({
    value: String(id),
    label: `Layer ${id}`,
  }));

  if (layerIds.length === 0) {
    return <div>No layer data available</div>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[180px] justify-between"
          >
            {selectedLayer
              ? layerOptions.find((layer) => layer.value === selectedLayer)
                  ?.label
              : "Select layer..."}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-0">
          <Command>
            <CommandInput placeholder="Search layer..." className="h-9" />
            <CommandList>
              <CommandEmpty>No layer found.</CommandEmpty>
              <CommandGroup>
                {layerOptions.map((layer) => (
                  <CommandItem
                    key={layer.value}
                    value={layer.value}
                    onSelect={(currentValue) => {
                      setSelectedLayer(
                        currentValue === selectedLayer ? "" : currentValue
                      );
                      setOpen(false);
                    }}
                  >
                    {layer.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        selectedLayer === layer.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Separator className="bg-border h-0.5 mt-1.5 mb-1.5" />
      <div className="flex flex-row gap-2.5 flex-wrap basis-1/3 w-full">
        <LayerChart
          layerId={Number(selectedLayer)}
          metric="mean"
          title="mean"
          className="flex-1 w-full"
        />
        <LayerChart
          layerId={Number(selectedLayer)}
          metric="stddev"
          title="std. dev"
          className="flex-1"
        />
        <LayerChart
          layerId={Number(selectedLayer)}
          metric="absmax"
          title="abs. max."
          className="flex-1"
        />
      </div>
      <LayerChart
        layerId={Number(selectedLayer)}
        metric="attn_entropy"
        title="mean attention entropy"
        style="w-full h-52"
        area={false}
      />
      <LayerChart
        layerId={Number(selectedLayer)}
        metric="grad_norm"
        title="gradient L2 normalization"
        style="w-full h-52"
        area={false}
      />
    </div>
  );
}
