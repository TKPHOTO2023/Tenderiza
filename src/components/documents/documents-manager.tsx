"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ExpiryBadge } from "./expiry-badge";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
import type { CompanyDocumentWithType } from "@/lib/api-types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DocumentType {
  id: string;
  code: string;
  label: string;
  requiresExpiry: boolean;
  isCustom: boolean;
}

export function DocumentsManager() {
  const { data: documentTypes, mutate: mutateTypes } = useSWR<DocumentType[]>(
    "/api/document-types",
    fetcher
  );
  const { data: documents, mutate: mutateDocuments } = useSWR<CompanyDocumentWithType[]>(
    "/api/documents",
    fetcher
  );

  const [documentTypeId, setDocumentTypeId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [customOpen, setCustomOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customRequiresExpiry, setCustomRequiresExpiry] = useState(false);

  const selectedType = documentTypes?.find((t) => t.id === documentTypeId);

  async function handleUpload() {
    if (!file || !documentTypeId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentTypeId", documentTypeId);
      if (expiryDate) formData.append("expiryDate", expiryDate);

      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (res.ok) {
        await mutateDocuments();
        setFile(null);
        setExpiryDate("");
        setDocumentTypeId("");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateCustomType() {
    if (!customLabel.trim()) return;
    const res = await fetch("/api/document-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: customLabel, requiresExpiry: customRequiresExpiry }),
    });
    const created = await res.json();
    await mutateTypes();
    setDocumentTypeId(created.id);
    setCustomLabel("");
    setCustomRequiresExpiry(false);
    setCustomOpen(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    await mutateDocuments();
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
            <div className="grid gap-1.5">
              <Label>Document type</Label>
              <div className="flex gap-2">
                <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={customOpen} onOpenChange={setCustomOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon" title="Add custom document type">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add a custom document type</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="customLabel">Document name</Label>
                        <Input
                          id="customLabel"
                          placeholder="e.g. Letter of Good Standing (COIDA)"
                          value={customLabel}
                          onChange={(e) => setCustomLabel(e.target.value)}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={customRequiresExpiry}
                          onChange={(e) => setCustomRequiresExpiry(e.target.checked)}
                        />
                        This document type has an expiry date
                      </label>
                    </div>
                    <DialogFooter>
                      <Button type="button" onClick={handleCreateCustomType}>
                        Add document type
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Expiry date {selectedType?.requiresExpiry ? "*" : "(optional)"}</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>File</Label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="button" onClick={handleUpload} disabled={!file || !documentTypeId || uploading}>
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {documents && documents.length === 0 && (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        )}
        {documents?.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{doc.documentType.label}</p>
                  <a
                    href={doc.fileUrl.startsWith("http") ? doc.fileUrl : `/api/documents/file/${doc.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {doc.fileName}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ExpiryBadge expiryDate={doc.expiryDate} />
                <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
