"use client";

import { useMetricsStore } from "@/store";
import { Separator } from "@radix-ui/react-select";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ResetMetrics() {
  const reset = useMetricsStore((s) => s.reset);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" className="font-normal">
          Reset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium">
            Confirm reset all data?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will clear all stored metrics
            permanently.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button variant="destructive" onClick={() => reset()}>
              Reset
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SaveReplay() {
  const handleDownload = async () => {
    const response = await fetch("http://localhost:3000/download-replay");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      response.headers
        .get("Content-Disposition")
        ?.split("filename=")[1]
        ?.replaceAll('"', "") || "replay.jsonl";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleDownload} className="font-normal">
      Save Replay
    </Button>
  );
}

function LoadReplay() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".jsonl")) {
      alert("Please upload a .jsonl file");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("http://localhost:3000/load-replay", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Loaded ${data.loaded} messages`);
      }
    } catch (error) {
      alert("Failed to load replay file");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="font-normal">
          Load Replay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium">Load Replay File</DialogTitle>
          <DialogDescription>
            Drag and drop a .jsonl file or click to browse
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-sm text-gray-600">
            {isLoading
              ? "Loading..."
              : "Drop replay file here or click to browse"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jsonl"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            disabled={isLoading}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Config() {
  return (
    <div className="flex flex-col gap-6">
      <span className="text-left text-[24px]">Configuration</span>
      <Separator className="bg-border h-0.5" />
      <div className="flex justify-between">
        <span>Save current training metrics</span>
        <SaveReplay />
      </div>
      <div className="flex justify-between">
        <span>Load previous training run</span>
        <LoadReplay />
      </div>
      <Separator className="bg-border h-0.5" />
      <div className="flex justify-between">
        <span>Reset currently loaded metrics</span>
        <ResetMetrics />
      </div>
    </div>
  );
}
