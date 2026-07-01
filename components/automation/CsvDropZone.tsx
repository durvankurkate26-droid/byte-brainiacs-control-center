"use client";

import {
  useRef,
  useState,
  useCallback,
  type DragEvent,
  type ChangeEvent,
} from "react";

interface CsvDropZoneProps {
  onFile: (file: File) => void;
  isParsing: boolean;
  fileName?: string;
}

export default function CsvDropZone({
  onFile,
  isParsing,
  fileName,
}: CsvDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | null | undefined) => {
      setDragError(null);
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setDragError("Only .csv files are accepted.");
        return;
      }
      onFile(file);
    },
    [onFile]
  );

  // ── Drag events ──────────────────────────────────────────────────────────
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
    setDragError(null);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Only clear when leaving the drop zone itself, not a child element.
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  // ── File input ────────────────────────────────────────────────────────────
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    // Reset so selecting the same file again still fires onChange.
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop a CSV file here or click to choose"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={[
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4",
          "rounded-lg border-2 border-dashed px-8 py-12 text-center transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac focus-visible:ring-offset-2 focus-visible:ring-offset-void",
          isDragOver
            ? "border-lilac bg-lilac/10 scale-[1.01]"
            : dragError
            ? "border-magenta/60 bg-magenta/5"
            : "border-lilac/30 bg-lilac/[0.03] hover:border-lilac/60 hover:bg-lilac/5",
        ].join(" ")}
      >
        {/* Icon */}
        <div
          className={`text-4xl transition-transform duration-150 ${
            isDragOver ? "scale-110" : ""
          }`}
        >
          {isParsing ? (
            <span className="inline-block animate-spin">⟳</span>
          ) : dragError ? (
            "✕"
          ) : (
            "⇩"
          )}
        </div>

        {/* Primary label */}
        <div>
          {isParsing ? (
            <p className="text-sm text-lilac">Parsing CSV…</p>
          ) : isDragOver ? (
            <p className="text-sm font-semibold text-lilac">Drop to upload</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-haze">
                Drag &amp; drop your CSV here
              </p>
              <p className="mt-1 text-xs text-mist">
                or click anywhere in this box
              </p>
            </>
          )}
        </div>

        {/* Choose file button — visually a button, but the whole zone is already clickable */}
        {!isParsing && (
          <button
            type="button"
            tabIndex={-1} // prevent double tab-stop; the zone itself is focusable
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="rounded border border-lilac/40 px-4 py-2 text-xs uppercase tracking-wider text-lilac transition-colors hover:bg-lilac/10"
          >
            Choose CSV
          </button>
        )}

        {/* Hidden real file input */}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onInputChange}
          aria-hidden="true"
        />
      </div>

      {/* Feedback row below the zone */}
      {dragError && (
        <p className="text-xs text-magenta">{dragError}</p>
      )}
      {fileName && !dragError && (
        <p className="flex items-center gap-2 text-xs text-mist">
          <span className="text-lilac">▸</span>
          <span className="font-medium text-haze">{fileName}</span>
          <span>selected</span>
        </p>
      )}
    </div>
  );
}
