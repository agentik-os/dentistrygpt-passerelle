import { useState, useEffect } from "react";

export function Settings() {
  const [docPath, setDocPath] = useState("");
  const [customDocPatientPath, setCustomDocPatientPath] = useState("");
  const [microphone, setMicrophone] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [saved, setSaved] = useState(false);
  const [version] = useState("1.0.0");
  const [cabinetName, setCabinetName] = useState("");
  const [microphones, setMicrophones] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    // Load saved settings
    Promise.all([
      window.electronAPI?.store.get("doc_patient_path"),
      window.electronAPI?.store.get("software.customDocPatientPath"),
      window.electronAPI?.store.get("microphone"),
      window.electronAPI?.store.get("theme"),
      window.electronAPI?.store.get("cabinet_name"),
    ]).then(([path, customPath, mic, th, cabinet]) => {
      if (path) setDocPath(path as string);
      if (customPath) setCustomDocPatientPath(customPath as string);
      if (mic) setMicrophone(mic as string);
      if (th) setTheme(th as "light" | "dark");
      if (cabinet) setCabinetName(cabinet as string);
    });

    // List available microphones
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const mics = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({ id: d.deviceId, label: d.label || "Microphone" }));
      setMicrophones(mics);
    });
  }, []);

  const handleBrowse = async () => {
    const path = await window.electronAPI?.openDirectory();
    if (path) setDocPath(path);
  };

  async function handleSave() {
    await Promise.all([
      window.electronAPI?.store.set("doc_patient_path", docPath),
      window.electronAPI?.store.set("software.customDocPatientPath", customDocPatientPath),
      window.electronAPI?.store.set("microphone", microphone),
      window.electronAPI?.store.set("theme", theme),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Parametres</h1>
      <p className="mt-1 text-sm text-slate-500">Configuration de la passerelle</p>

      <div className="mt-6 space-y-6">
        {/* DOCPATIENT folder */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Dossier DOCPATIENT</h2>
          <p className="mt-1 text-xs text-slate-500">
            Chemin vers le dossier contenant les documents patients
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={docPath}
              onChange={(e) => setDocPath(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#c96442] focus:ring-2 focus:ring-[#c96442]/20"
              placeholder="C:\DOCPATIENT"
            />
            <button
              onClick={handleBrowse}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Parcourir
            </button>
          </div>
        </section>

        {/* Custom DOCPATIENT path */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Chemin DOCPATIENT personnalise</h2>
          <p className="mt-1 text-xs text-slate-500">
            Chemin personnalise pour exporter les documents patients (remplace le chemin par defaut du logiciel dentaire)
          </p>
          <input
            type="text"
            value={customDocPatientPath}
            onChange={(e) => setCustomDocPatientPath(e.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#c96442] focus:ring-2 focus:ring-[#c96442]/20"
            placeholder="Ex: D:\DOCPATIENT ou \\serveur\DOCPATIENT (laisser vide pour utiliser le chemin par defaut)"
          />
        </section>

        {/* Microphone */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Microphone</h2>
          <p className="mt-1 text-xs text-slate-500">
            Peripherique d'entree audio pour la dictee vocale
          </p>
          <select
            value={microphone}
            onChange={(e) => setMicrophone(e.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#c96442] focus:ring-2 focus:ring-[#c96442]/20"
          >
            <option value="">Selectionner un microphone</option>
            {microphones.map((mic) => (
              <option key={mic.id} value={mic.id}>
                {mic.label}
              </option>
            ))}
          </select>
        </section>

        {/* Theme */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Theme</h2>
          <p className="mt-1 text-xs text-slate-500">Apparence de l'application</p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                theme === "light"
                  ? "border-[#c96442] bg-[#c96442]/5 text-[#c96442]"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              Clair
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                theme === "dark"
                  ? "border-[#c96442] bg-[#c96442]/5 text-[#c96442]"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              Sombre
            </button>
          </div>
        </section>

        {/* About */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">A propos</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Version</span>
              <span className="font-medium text-slate-900">v{version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cabinet</span>
              <span className="font-medium text-slate-900">{cabinetName || "Non configure"}</span>
            </div>
          </div>
        </section>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="rounded-lg bg-[#c96442] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b55638]"
          >
            Enregistrer
          </button>
          {saved && <span className="text-sm text-green-600">Enregistre !</span>}
        </div>
      </div>
    </div>
  );
}
