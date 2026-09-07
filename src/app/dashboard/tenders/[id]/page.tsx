"use client";

import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ClosingBadge } from "@/components/tenders/closing-badge";
import { DocumentRow } from "@/components/tenders/document-row";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Tender } from "@prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: tender, isLoading } = useSWR<Tender>(`/api/tenders/${id}`, fetcher);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!tender) return <p className="text-sm text-muted-foreground">Tender not found.</p>;

  return (
    <div className="grid gap-6">
      <Link href="/dashboard/tenders">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" /> Back to tenders
        </Button>
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{tender.title || "Untitled tender"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">OCID: {tender.ocid}</p>
        </div>
        <ClosingBadge closingDate={tender.closingDate} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Row label="Buyer" value={tender.buyerName} />
            <Row label="Province" value={tender.province} />
            <Row label="Category" value={tender.category} />
            <Row label="Status" value={tender.status} />
            <Row label="Published" value={formatDate(tender.publishedDate)} />
            <Row label="Closing date" value={formatDate(tender.closingDate)} />
            <Row
              label="Estimated value"
              value={
                tender.estimatedValue != null
                  ? formatCurrency(tender.estimatedValue, tender.currency)
                  : null
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {tender.documentUrls.length === 0 && (
              <p className="text-sm text-muted-foreground">No documents linked.</p>
            )}
            {tender.documentUrls.map((url, i) => (
              <DocumentRow key={i} url={url} label={`Document ${i + 1}`} />
            ))}
            {tender.sourceUrl && (
              <>
                <Separator className="my-2" />
                <a
                  href={tender.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" /> View original source
                </a>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {tender.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{tender.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      {value ? <span className="text-right">{value}</span> : <Badge variant="outline">Unknown</Badge>}
    </div>
  );
}
