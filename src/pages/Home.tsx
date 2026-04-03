import { useState, useEffect, useCallback, useRef } from "react";

interface Document {
  id: string;
  name: string;
  type: string;
  date: string;
  status: "pending" | "synced" | "error";
  size: number;
}

const statusLabels: Record<Document["status"], { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-50 text-amber-700" },
  synced: { label: "Synchronise", className: "bg-green-50 text-green-700" },
  error: { label: "Erreur", className: "bg-red-50 text-red-700" },
};

const POLL_INTERVAL = 30_000; // 30 seconds

export function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [cabinetName, setCabinetName] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Load store values
      const [cabinet, syncTime, syncedIds] = await Promise.all([
        window.electronAPI?.store.get("cabinet_name"),
        window.electronAPI?.store.get("last_sync"),
        window.electronAPI?.store.get("synced_document_ids") as Promise<string[] | undefined>,
      ]);
      if (cabinet) setCabinetName(cabinet as string);
      if (syncTime) setLastSync(syncTime as string);

      // Fetch pending documents from the API
      const result = await window.electronAPI?.api.getPendingDocuments(50);
      if (result?.success && result.data?.documents) {
        const alreadySynced = new Set(syncedIds || []);
        const docs: Document[] = result.data.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          date: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
          status: alreadySynced.has(doc.id) ? ("synced" as const) : ("pending" as const),
          size: doc.size || 0,
        }));
        setDocuments(docs);
      }

      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    loadData();

    pollRef.current = setInterval(loadData, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadData]);

  async function syncDocument(id: string) {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;

    setSyncing(id);
    try {
      // Get the download URL for this document
      const downloadResult = await window.electronAPI?.api.downloadDocument(id);
      if (!downloadResult?.success || !downloadResult.data?.pdfUrl) {
        throw new Error("Impossible de telecharger le document");
      }

      // Get the dental software setting
      const software = (await window.electronAPI?.store.get("software.name")) as string || "desktop";

      // Call the real sync IPC handler — this downloads the file to the correct location
      const syncResult = await window.electronAPI?.sync({
        documentUrl: downloadResult.data.pdfUrl,
        documentName: downloadResult.data.fileName || doc.name,
        patientId: "", // TODO: extract from document patientIds when available
        externalSource: software,
      });

      if (syncResult?.success) {
        // Mark as synced in the UI
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: "synced" as const } : d))
        );

        // Track synced document ID in the store
        const syncedIds = ((await window.electronAPI?.store.get("synced_document_ids")) as string[] | undefined) || [];
        if (!syncedIds.includes(id)) {
          await window.electronAPI?.store.set("synced_document_ids", [...syncedIds, id]);
        }

        // Update last sync time
        const now = new Date().toISOString();
        await window.electronAPI?.store.set("last_sync", now);
        setLastSync(now);

        // Report success to the API
        await window.electronAPI?.api.updateDocumentStatus(id, {
          success: true,
          path: syncResult.filePath || undefined,
        });
      } else {
        throw new Error(syncResult?.error || "Echec de la synchronisation");
      }
    } catch (err) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "error" as const } : d))
      );

      // Report failure to the API
      await window.electronAPI?.api.updateDocumentStatus(id, {
        success: false,
        error: (err as Error).message,
      }).catch(() => {});
    } finally {
      setSyncing(null);
    }
  }

  async function syncAll() {
    const pending = documents.filter((d) => d.status === "pending");
    for (const doc of pending) {
      await syncDocument(doc.id);
    }
  }

  const pendingCount = documents.filter((d) => d.status === "pending").length;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">Documents en attente</h1>
          {pendingCount > 0 && (
            <span className="rounded-full bg-[#c96442] px-2.5 py-0.5 text-xs font-medium text-white">
              {pendingCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={syncAll}
              disabled={syncing !== null}
              className="rounded-lg bg-[#c96442] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#b55638] disabled:opacity-50"
            >
              Tout synchroniser
            </button>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "..." : "Rafraichir"}
          </button>
        </div>
      </div>

      {/* Status card */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Connexion</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
              <span className="font-medium text-slate-900">
                {connected ? "Connecte" : "Deconnecte"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-slate-500">Derniere synchronisation</p>
            <p className="mt-1 font-medium text-slate-900">
              {lastSync ? new Date(lastSync).toLocaleString("fr-FR") : "Jamais"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Cabinet</p>
            <p className="mt-1 font-medium text-slate-900">{cabinetName || "Non configure"}</p>
          </div>
        </div>
      </div>

      {/* Documents table */}
      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">Chargement des documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="mt-3 text-sm text-slate-500">Aucun document en attente de synchronisation</p>
          <p className="mt-1 text-xs text-slate-400">Rafraichissement automatique toutes les 30 secondes</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-500">Nom</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Type</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Statut</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const status = statusLabels[doc.status];
                return (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{doc.name}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.type}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(doc.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {doc.status === "pending" && (
                        <button
                          onClick={() => syncDocument(doc.id)}
                          disabled={syncing === doc.id}
                          className="rounded-lg bg-[#c96442] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#b55638] disabled:opacity-50"
                        >
                          {syncing === doc.id ? "Sync..." : "Synchroniser"}
                        </button>
                      )}
                      {doc.status === "error" && (
                        <button
                          onClick={() => syncDocument(doc.id)}
                          disabled={syncing === doc.id}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                        >
                          {syncing === doc.id ? "Sync..." : "Reessayer"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
