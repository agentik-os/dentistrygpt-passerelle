import { useState, useEffect } from "react";

const softwareOptions = [
  { id: "julie", name: "Julie Solutions", description: "Logiciel de gestion pour cabinets dentaires" },
  { id: "logosw", name: "LogosW", description: "Solution complete de gestion de cabinet" },
  { id: "visiodent", name: "Visiodent", description: "Imagerie et gestion dentaire integree" },
  { id: "desmos", name: "Desmos", description: "Gestion de cabinet et imagerie dentaire" },
  { id: "orthalis", name: "Orthalis", description: "Logiciel specialise en orthodontie" },
  { id: "kitview", name: "Kitview", description: "Gestion de laboratoire dentaire" },
  { id: "other", name: "Autre", description: "Logiciel non liste ci-dessus" },
];

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

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Logiciel dentaire</h1>
      <p className="mt-1 text-sm text-slate-500">
        Selectionnez votre logiciel de gestion dentaire
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

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!selected || (selected === "other" && !customName)}
          className="rounded-lg bg-[#c96442] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b55638] disabled:opacity-50"
        >
          Enregistrer
        </button>
        {saved && <span className="text-sm text-green-600">Enregistre !</span>}
      </div>
    </div>
  );
}
