import { useState, useEffect } from "react";

const softwareOptions = [
  { id: "julie", name: "Julie Solutions", description: "Logiciel de gestion pour cabinets dentaires" },
  { id: "logosw", name: "LogosW", description: "Solution complète de gestion de cabinet" },
  { id: "visiodent", name: "Visiodent", description: "Imagerie et gestion dentaire intégrée" },
  { id: "desmos", name: "Desmos", description: "Gestion de cabinet et imagerie dentaire" },
  { id: "orthalis", name: "Orthalis", description: "Logiciel spécialisé en orthodontie" },
  { id: "kitview", name: "Kitview", description: "Gestion de laboratoire dentaire" },
  { id: "veasy", name: "Veasy (Planmeca)", description: "Suite logicielle Planmeca pour cabinet dentaire" },
  { id: "progident", name: "Progident (Carestream)", description: "Solution Carestream Dental pour gestion de cabinet" },
  { id: "agatha", name: "Agatha", description: "Logiciel de gestion pour cabinets dentaires" },
  { id: "galaxie", name: "Galaxie", description: "Solution de gestion et télétransmission dentaire" },
  { id: "dentalsoft", name: "DentalSoft", description: "Logiciel cloud de gestion dentaire" },
  { id: "sidexis", name: "Sidexis (Dentsply Sirona)", description: "Imagerie et gestion Dentsply Sirona" },
  { id: "ax", name: "Ax Santé", description: "Solution de gestion pour professionnels de santé" },
  { id: "axisante", name: "Axisanté", description: "Logiciel de gestion de cabinet médical et dentaire" },
  { id: "other", name: "Autre", description: "Logiciel non listé ci-dessus" },
];

const setupInstructions: Record<string, string[]> = {
  julie: [
    "Vérifiez que Julie Solutions est installé sur votre poste ou serveur.",
    "Localisez le dossier DOCPATIENT (généralement \\\\SERVEUR\\Juliew\\DOCPATIENT ou C:\\Juliew\\DOCPATIENT).",
    "Allez dans Paramètres de la Passerelle et indiquez ce chemin.",
    "La Passerelle déposera automatiquement les rapports dans le dossier du patient correspondant.",
  ],
  logosw: [
    "Vérifiez que LogosW est installé (c:\\wlogos1\\).",
    "Vérifiez la présence de ANXAGENT.EXE dans le dossier LogosW.",
    "La Passerelle importera automatiquement les documents via ANXAGENT.EXE.",
    "Aucune configuration supplémentaire requise si LogosW est au chemin standard.",
  ],
  visiodent: [
    "Ouvrez Visiodent et notez le chemin du dossier d'importation de documents.",
    "Allez dans Paramètres de la Passerelle.",
    "Indiquez le chemin du dossier d'importation.",
    "Les rapports seront déposés automatiquement dans ce dossier.",
  ],
  desmos: [
    "Ouvrez Desmos, allez dans Configuration > Import de documents.",
    "Notez le chemin du dossier DOCPATIENT configuré.",
    "Reportez ce chemin dans les Paramètres de la Passerelle.",
    "Synchronisation automatique des rapports.",
  ],
  orthalis: [
    "Ouvrez Orthalis et allez dans Paramètres > Dossiers.",
    "Notez le chemin du dossier documents patients.",
    "Configurez ce chemin dans les Paramètres de la Passerelle.",
    "Les rapports orthodontiques seront synchronisés automatiquement.",
  ],
  kitview: [
    "Connectez-vous à Kitview sur votre poste.",
    "Allez dans Administration > Configuration des imports.",
    "Notez le chemin du dossier d'importation.",
    "Configurez ce chemin dans la Passerelle.",
  ],
  veasy: [
    "Ouvrez Veasy et allez dans Paramètres > Documents.",
    "Notez le dossier d'importation ou le chemin DOCPATIENT.",
    "Configurez ce chemin dans la Passerelle.",
    "Synchronisation automatique.",
  ],
  progident: [
    "Ouvrez Progident et allez dans Outils > Configuration.",
    "Notez le chemin du dossier DOCPATIENT.",
    "Reportez-le dans les Paramètres de la Passerelle.",
    "Les rapports seront copiés automatiquement.",
  ],
  agatha: [
    "Ouvrez Agatha et localisez le dossier de stockage des documents.",
    "Configurez ce chemin dans la Passerelle.",
    "Synchronisation automatique des rapports.",
  ],
  galaxie: [
    "Ouvrez Galaxie et allez dans Configuration > Répertoires.",
    "Notez le chemin des documents patients.",
    "Configurez la Passerelle avec ce chemin.",
  ],
  dentalsoft: [
    "DentalSoft sera connecté directement via API (intégration en cours).",
    "Aucune configuration de dossier nécessaire.",
    "Les rapports seront synchronisés automatiquement via l'API DentalSoft.",
  ],
  sidexis: [
    "Ouvrez Sidexis et localisez le dossier d'importation DICOM/documents.",
    "Notez le chemin.",
    "Configurez-le dans la Passerelle.",
  ],
  ax: [
    "Ouvrez Ax Santé et allez dans Paramètres > Documents.",
    "Notez le chemin du dossier d'importation.",
    "Configurez ce chemin dans la Passerelle.",
    "Synchronisation automatique des rapports.",
  ],
  axisante: [
    "Ouvrez Axisanté et allez dans Configuration > Dossiers.",
    "Notez le chemin du dossier documents patients.",
    "Configurez ce chemin dans les Paramètres de la Passerelle.",
    "Les rapports seront déposés automatiquement.",
  ],
  other: [
    "Allez dans Paramètres pour définir le chemin du dossier où déposer les documents.",
    "Contactez le support si vous avez besoin d'aide pour localiser le dossier DOCPATIENT de votre logiciel.",
  ],
};

export function Software() {
  const [selected, setSelected] = useState("");
  const [customName, setCustomName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      window.electronAPI?.store.get("dental_software"),
      window.electronAPI?.store.get("dental_software_custom"),
    ]).then(([val, custom]) => {
      if (val) setSelected(val as string);
      if (custom) setCustomName(custom as string);
    });
  }, []);

  async function handleSave() {
    const softwareName = selected === "other" ? customName : selected;
    await Promise.all([
      window.electronAPI?.store.set("dental_software", selected),
      // Also save as software.name for sync-document compatibility
      window.electronAPI?.store.set("software.name", softwareName),
      selected === "other"
        ? window.electronAPI?.store.set("dental_software_custom", customName)
        : Promise.resolve(),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const instructions = selected ? setupInstructions[selected] : null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Logiciel dentaire</h1>
      <p className="mt-1 text-sm text-slate-500">
        Sélectionnez votre logiciel de gestion dentaire
      </p>

      <div className="mt-6 space-y-3">
        {softwareOptions.map((sw) => (
          <label
            key={sw.id}
            className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
              selected === sw.id
                ? "border-[#c96442] bg-[#c96442]/5"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="software"
              value={sw.id}
              checked={selected === sw.id}
              onChange={(e) => setSelected(e.target.value)}
              className="h-4 w-4 accent-[#c96442]"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{sw.name}</p>
              <p className="text-xs text-slate-500">{sw.description}</p>
            </div>
            {selected === sw.id && (
              <svg className="h-5 w-5 text-[#c96442]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            )}
          </label>
        ))}
      </div>

      {/* Custom software name input */}
      {selected === "other" && (
        <div className="mt-4">
          <label htmlFor="custom-software" className="mb-1 block text-sm font-medium text-slate-700">
            Nom du logiciel
          </label>
          <input
            id="custom-software"
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#c96442] focus:ring-2 focus:ring-[#c96442]/20"
            placeholder="Nom de votre logiciel"
          />
        </div>
      )}

      {/* Setup instructions per software */}
      {selected && instructions && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 bg-[#c96442]/5 border-b border-slate-100 px-4 py-3">
            <svg className="h-4 w-4 text-[#c96442]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            <p className="text-sm font-medium text-slate-700">
              Instructions de configuration — {softwareOptions.find((s) => s.id === selected)?.name}
            </p>
          </div>
          <div className="p-4">
            <ol className="space-y-2">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-xs text-slate-600 leading-relaxed">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c96442]/10 text-[10px] font-semibold text-[#c96442]">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-100 p-2.5">
              <svg className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <p className="text-[10px] text-slate-500">
                Besoin d&apos;aide ? Contactez notre équipe support à <span className="text-[#c96442] font-medium">cto.dentistrygpt@gmail.com</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!selected || (selected === "other" && !customName)}
          className="rounded-lg bg-[#c96442] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b55638] disabled:opacity-50"
        >
          Enregistrer
        </button>
        {saved && <span className="text-sm text-green-600">Enregistré !</span>}
      </div>
    </div>
  );
}
