export async function syncReferences(
  existingIds: string[],
  drafts: { id?: string; clientName: string; projectDescription: string; value: string; year: string }[]
) {
  const keptIds = new Set(drafts.filter((d) => d.id).map((d) => d.id as string));
  const removed = existingIds.filter((id) => !keptIds.has(id));

  await Promise.all(removed.map((id) => fetch(`/api/references/${id}`, { method: "DELETE" })));

  await Promise.all(
    drafts
      .filter((d) => !d.id && d.clientName.trim())
      .map((d) =>
        fetch("/api/references", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        })
      )
  );
}

export async function syncAccreditations(
  existingIds: string[],
  drafts: { id?: string; name: string; referenceNo: string; expiryDate: string }[]
) {
  const keptIds = new Set(drafts.filter((d) => d.id).map((d) => d.id as string));
  const removed = existingIds.filter((id) => !keptIds.has(id));

  await Promise.all(removed.map((id) => fetch(`/api/accreditations/${id}`, { method: "DELETE" })));

  await Promise.all(
    drafts
      .filter((d) => !d.id && d.name.trim())
      .map((d) =>
        fetch("/api/accreditations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        })
      )
  );
}
