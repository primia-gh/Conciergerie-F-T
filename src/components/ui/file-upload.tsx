"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { Paperclip, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  onFilesChange: (files: File[]) => void;
  className?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function FileUpload({ accept, multiple = true, maxSizeMb, onFilesChange, className }: FileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);

    if (maxSizeMb) {
      const tooBig = incoming.find((f) => f.size > maxSizeMb * 1024 * 1024);
      if (tooBig) {
        setError(`"${tooBig.name}" dépasse la taille maximale de ${maxSizeMb} Mo.`);
        return;
      }
    }

    setError(null);
    const next = multiple ? [...files, ...incoming] : incoming.slice(0, 1);
    setFiles(next);
    onFilesChange(next);
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesChange(next);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label
        htmlFor={inputId}
        onDragOver={(e: DragEvent) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          setIsDragging(false);
          applyFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
          isDragging ? "border-accent bg-accent/5" : "border-border hover:bg-bg-subtle",
        )}
      >
        <Upload className="h-5 w-5 text-fg-muted" />
        <p className="text-sm text-fg">
          Glissez un fichier ici ou <span className="font-medium text-accent">parcourir</span>
        </p>
        {maxSizeMb && <p className="text-xs text-fg-muted">Taille maximale : {maxSizeMb} Mo</p>}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => applyFiles(e.target.files)}
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              <Paperclip className="h-4 w-4 shrink-0 text-fg-muted" />
              <span className="flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-fg-muted">{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="shrink-0 text-fg-muted transition-colors hover:text-danger"
                aria-label={`Retirer ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
