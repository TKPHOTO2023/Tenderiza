import { DocumentsManager } from "@/components/documents/documents-manager";

export default function DocumentsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Keep your compliance documents current — expiring certificates are flagged automatically.
        </p>
      </div>
      <DocumentsManager />
    </div>
  );
}
