import { useState, useEffect } from "react";

// ─── Software definitions with sync capabilities ────────

interface SoftwareDefinition {
  id: string;
  name: string;
  description: string;
  syncStrategy: "docpatient" | "anxagent" | "api" | "manual";
  dataTypes: string[];
  defaultPaths?: string[];
  instructions: string[];
}

const softwareDefinitions: SoftwareDefinition[] = [
  {
    id: "julie",
    name: "Julie Solutions",
    description: "Logiciel de gestion pour cabinets dentaires",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Comptes-rendus", "Ordonnances", "Courriers"],
    defaultPaths: ["\\\\SERVEUR\\Juliew\\DOCPATIENT", "C:\\Juliew\\DOCPATIENT"],
    instructions: [
      "Localisez le dossier DOCPATIENT (generalement \\\\SERVEUR\\Juliew\\DOCPATIENT).",
      "Indiquez ce chemin ci-dessous.",
      "La Passerelle deposera automatiquement les rapports dans le dossier du patient.",
    ],
  },
  {
    id: "logosw",
    name: "LogosW",
    description: "Solution complete de gestion de cabinet",
    syncStrategy: "anxagent",
    dataTypes: ["Rapports PDF", "Comptes-rendus", "Documents patients"],
    defaultPaths: ["C:\\wlogos1\\"],
    instructions: [
      "Verifiez que LogosW est installe (c:\\wlogos1\\).",
      "La Passerelle importera les documents via ANXAGENT.EXE.",
      "Aucune configuration supplementaire si LogosW est au chemin standard.",
    ],
  },
  {
    id: "visiodent",
    name: "Visiodent",
    description: "Imagerie et gestion dentaire integree",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Comptes-rendus", "Images", "Radiographies"],
    instructions: [
      "Dans Visiodent, notez le chemin du dossier d'importation de documents.",
      "Indiquez ce chemin ci-dessous.",
      "Les rapports seront deposes automatiquement.",
    ],
  },
  {
    id: "desmos",
    name: "Desmos",
    description: "Gestion de cabinet et imagerie dentaire",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Comptes-rendus", "Documents patients"],
    instructions: [
      "Dans Desmos > Configuration > Import de documents, notez le chemin DOCPATIENT.",
      "Indiquez ce chemin ci-dessous.",
    ],
  },
  {
    id: "orthalis",
    name: "Orthalis",
    description: "Logiciel specialise en orthodontie",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports orthodontiques", "Plans de traitement", "Comptes-rendus"],
    instructions: [
      "Dans Orthalis > Parametres > Dossiers, notez le chemin documents patients.",
      "Indiquez ce chemin ci-dessous.",
    ],
  },
  {
    id: "veasy",
    name: "Veasy (Planmeca)",
    description: "Suite logicielle Planmeca pour cabinet dentaire",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Imagerie", "Documents patients"],
    instructions: [
      "Dans Veasy > Parametres > Documents, notez le dossier d'importation.",
      "Indiquez ce chemin ci-dessous.",
    ],
  },
  {
    id: "axisante",
    name: "Axisante",
    description: "Logiciel de gestion de cabinet medical et dentaire",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Comptes-rendus", "Courriers"],
    instructions: [
      "Dans Axisante > Configuration > Dossiers, notez le chemin documents patients.",
      "Indiquez ce chemin ci-dessous.",
    ],
  },
  {
    id: "dental-master",
    name: "Dental Master",
    description: "Logiciel de gestion et imagerie pour cabinets dentaires",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Imagerie", "Documents patients"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
      "Les rapports seront deposes automatiquement dans le dossier du patient.",
    ],
  },
  {
    id: "dentagest",
    name: "DentaGest",
    description: "Logiciel de gestion de cabinet dentaire",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Comptes-rendus", "Documents patients"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
    ],
  },
  {
    id: "identist",
    name: "iDentist",
    description: "Solution de gestion et imagerie dentaire integree",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Imagerie", "Documents patients"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
    ],
  },
  {
    id: "sterildent",
    name: "SterilDent",
    description: "Tracabilite et sterilisation pour cabinets dentaires",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports sterilisation", "Tracabilite", "Documents"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
    ],
  },
  {
    id: "atal",
    name: "Atal",
    description: "Solution de gestion et comptabilite pour cabinets dentaires",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Comptes-rendus", "Documents comptables"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
    ],
  },
  {
    id: "crossway",
    name: "Crossway",
    description: "Logiciel de gestion de cabinet medical et dentaire",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Comptes-rendus", "Courriers"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
    ],
  },
  {
    id: "opta-s",
    name: "Opta-S",
    description: "Solution de gestion pour cabinets dentaires",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Documents patients"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
    ],
  },
  {
    id: "clinident",
    name: "Clinident",
    description: "Logiciel de gestion pour centres dentaires et cabinets",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Comptes-rendus", "Documents patients"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
    ],
  },
  {
    id: "dovetail",
    name: "Dovetail",
    description: "Solution de gestion de cabinet dentaire",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Documents patients"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
    ],
  },
  {
    id: "cabinet-vision",
    name: "Cabinet Vision",
    description: "Logiciel de gestion et organisation de cabinet",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Documents patients"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
    ],
  },
  {
    id: "agatha",
    name: "Agatha",
    description: "Logiciel de gestion pour cabinets dentaires",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Documents patients"],
    instructions: [
      "Localisez le dossier de stockage des documents dans Agatha.",
      "Indiquez ce chemin ci-dessous.",
    ],
  },
  {
    id: "mediagest",
    name: "Mediagest",
    description: "Solution de gestion et teletransmission dentaire",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Teletransmission", "Documents patients"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
    ],
  },
  {
    id: "hellodent",
    name: "HelloDent",
    description: "Logiciel cloud de gestion de cabinet dentaire",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Documents patients"],
    instructions: [
      "Configurez le chemin du dossier DOCPATIENT ci-dessous.",
    ],
  },
  {
    id: "dentalsoft",
    name: "DentalSoft",
    description: "Logiciel cloud de gestion dentaire",
    syncStrategy: "api",
    dataTypes: ["Rapports PDF (via API)", "Documents patients"],
    instructions: [
      "DentalSoft sera connecte directement via API.",
      "Aucune configuration de dossier necessaire.",
    ],
  },
  {
    id: "ax",
    name: "Ax Sante",
    description: "Solution de gestion pour professionnels de sante",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Documents patients"],
    instructions: [
      "Dans Ax Sante > Parametres > Documents, notez le chemin d'importation.",
      "Indiquez ce chemin ci-dessous.",
    ],
  },
  {
    id: "progident",
    name: "Progident (Carestream)",
    description: "Solution Carestream Dental pour gestion de cabinet",
    syncStrategy: "docpatient",
    dataTypes: ["Rapports PDF", "Imagerie", "Documents patients"],
    instructions: [
      "Dans Progident > Outils > Configuration, notez le chemin DOCPATIENT.",
      "Indiquez ce chemin ci-dessous.",
    ],
  },
  {
    id: "dentally",
    name: "Dentally",
    description: "Logiciel cloud de gestion de cabinet dentaire",
    syncStrategy: "api",
    dataTypes: ["Rapports PDF (via API)", "Documents patients"],
    instructions: [
      "Dentally sera connecte via API.",
      "Aucune configuration de dossier necessaire.",
    ],
  },
  {
    id: "other",
    name: "Autre logiciel",
    description: "Logiciel non liste ci-dessus",
    syncStrategy: "manual",
    dataTypes: ["Rapports PDF", "Documents patients"],
    instructions: [
      "Indiquez le chemin du dossier ou deposer les documents ci-dessous.",
    ],
  },
];

// ─── Per-software config stored in electron-store ────────

interface SoftwareConfig {
  enabled: boolean;
  docPatientPath: string;
  customName?: string; // only for "other"
  lastSyncAt?: number;
}

type SoftwareConfigs = Record<string, SoftwareConfig>;

// ─── Component ───────────────────────────────────────────

export function Software() {
  const [configs, setConfigs] = useState<SoftwareConfigs>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // Load all software configs on mount
  useEffect(() => {
    window.electronAPI?.store.get("software_configs").then((stored) => {
      if (stored && typeof stored === "object") {
        setConfigs(stored as SoftwareConfigs);
      }
    });
  }, []);

  // Persist configs to electron-store
  const saveConfig = async (id: string, config: SoftwareConfig) => {
    setSaving(id);
    const updated = { ...configs, [id]: config };
    setConfigs(updated);
    await window.electronAPI?.store.set("software_configs", updated);

    // Also update legacy keys for sync-document compatibility
    if (config.enabled) {
      const softwareName = id === "other" ? (config.customName || "other") : id;
      await window.electronAPI?.store.set("dental_software", id);
      await window.electronAPI?.store.set("software.name", softwareName);
      if (config.docPatientPath) {
        await window.electronAPI?.store.set("doc_patient_path", config.docPatientPath);
      }
    }

    setTimeout(() => setSaving(null), 1500);
  };

  const removeConfig = async (id: string) => {
    const updated = { ...configs };
    delete updated[id];
    setConfigs(updated);
    await window.electronAPI?.store.set("software_configs", updated);
    setExpandedId(null);
  };

  const handleBrowse = async (id: string) => {
    const path = await window.electronAPI?.openDirectory();
    if (path) {
      const current = configs[id] || { enabled: true, docPatientPath: "" };
      await saveConfig(id, { ...current, docPatientPath: path });
    }
  };

  const configuredCount = Object.values(configs).filter((c) => c.enabled).length;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Logiciels dentaires</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configurez chaque logiciel individuellement pour synchroniser vos donnees
          </p>
        </div>
        {configuredCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-[#c96442]/10 px-3 py-1 text-xs font-medium text-[#c96442]">
            {configuredCount} configure{configuredCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Software list */}
      <div className="mt-6 space-y-2">
        {softwareDefinitions.map((sw) => {
          const config = configs[sw.id];
          const isExpanded = expandedId === sw.id;
          const isConfigured = config?.enabled;
          const isSaving = saving === sw.id;

          return (
            <div
              key={sw.id}
              className={`rounded-xl border transition-all ${
                isConfigured
                  ? "border-[#c96442]/40 bg-[#c96442]/5"
                  : "border-slate-200 bg-white"
              }`}
            >
              {/* Software row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : sw.id)}
                className="flex w-full items-center gap-4 p-4 text-left"
              >
                {/* Status indicator */}
                <div
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    isConfigured ? "bg-green-500" : "bg-slate-300"
                  }`}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{sw.name}</p>
                    {sw.syncStrategy === "api" && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                        API
                      </span>
                    )}
                    {sw.syncStrategy === "anxagent" && (
                      <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">
                        RPA
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{sw.description}</p>
                </div>

                {/* Status badge */}
                {isConfigured && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    Connecte
                  </span>
                )}

                {/* Chevron */}
                <svg
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded config panel */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
                  {/* Data types */}
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-1.5">Donnees synchronisables</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sw.dataTypes.map((dt) => (
                        <span
                          key={dt}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                        >
                          {dt}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className="h-3.5 w-3.5 text-[#c96442]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                      <p className="text-xs font-medium text-slate-700">Configuration</p>
                    </div>
                    <ol className="space-y-1">
                      {sw.instructions.map((step, i) => (
                        <li key={i} className="flex gap-2 text-[11px] text-slate-600 leading-relaxed">
                          <span className="shrink-0 text-[#c96442] font-semibold">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Custom name for "other" */}
                  {sw.id === "other" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nom du logiciel
                      </label>
                      <input
                        type="text"
                        value={config?.customName || ""}
                        onChange={(e) => {
                          const current = config || { enabled: false, docPatientPath: "" };
                          setConfigs({
                            ...configs,
                            [sw.id]: { ...current, customName: e.target.value },
                          });
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#c96442] focus:ring-2 focus:ring-[#c96442]/20"
                        placeholder="Nom de votre logiciel"
                      />
                    </div>
                  )}

                  {/* DOCPATIENT path config (not for API-based software) */}
                  {sw.syncStrategy !== "api" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Chemin DOCPATIENT
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={config?.docPatientPath || ""}
                          onChange={(e) => {
                            const current = config || { enabled: false, docPatientPath: "" };
                            setConfigs({
                              ...configs,
                              [sw.id]: { ...current, docPatientPath: e.target.value },
                            });
                          }}
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#c96442] focus:ring-2 focus:ring-[#c96442]/20"
                          placeholder={
                            sw.defaultPaths?.[0] || "Chemin vers le dossier DOCPATIENT"
                          }
                        />
                        <button
                          onClick={() => handleBrowse(sw.id)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Parcourir
                        </button>
                      </div>
                      {sw.defaultPaths && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          Chemins habituels : {sw.defaultPaths.join(", ")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() =>
                        saveConfig(sw.id, {
                          ...(config || { docPatientPath: "" }),
                          enabled: true,
                        })
                      }
                      disabled={
                        isSaving ||
                        (sw.syncStrategy !== "api" && !configs[sw.id]?.docPatientPath)
                      }
                      className="rounded-lg bg-[#c96442] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#b55638] disabled:opacity-50"
                    >
                      {isSaving ? "Enregistre !" : isConfigured ? "Mettre a jour" : "Activer"}
                    </button>
                    {isConfigured && (
                      <button
                        onClick={() => removeConfig(sw.id)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        Deconnecter
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help footer */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-2">
          <svg className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div>
            <p className="text-xs text-slate-600">
              Chaque logiciel est configure independamment. Une fois active, DentistryGPT detecte
              automatiquement le lien et synchronise les documents.
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Besoin d&apos;aide ? Contactez <span className="text-[#c96442] font-medium">cto.dentistrygpt@gmail.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
