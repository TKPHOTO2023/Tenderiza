"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Eye, EyeOff, FileText } from "lucide-react";

function isPreviewable(url: string) {
  return /\.pdf(\?.*)?$/i.test(url);
}

export function DocumentRow({ url, label }: { url: string; label: string }) {
  const [open, setOpen] = useState(false);
  const proxyUrl = `/api/tenders/documents/proxy?url=${encodeURIComponent(url)}`;
  const previewable = isPreviewable(url);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" /> {label}
        </span>
        <div className="flex items-center gap-1">
          {previewable && (
            <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
              {open ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {open ? "Hide preview" : "Preview"}
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <a href={url} target="_blank" rel="noreferrer" download>
              <Download className="h-4 w-4" /> Download
            </a>
          </Button>
        </div>
      </div>
      {open && previewable && (
        <iframe
          src={proxyUrl}
          className="h-[75vh] w-full rounded-md border border-border"
          title={label}
        />
      )}
      {open && !previewable && (
        <p className="text-xs text-muted-foreground">
          Preview isn&apos;t available for this file type — use Download instead.
        </p>
      )}
    </div>
  );
}
