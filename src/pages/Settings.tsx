import { useState, useEffect } from "react";

export function Settings() {
  const [microphone, setMicrophone] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [autoStart, setAutoStart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [version] = useState("1.1.0");
  const [cabinetName, setCabinetName] = useState("");
  const [microphones, setMicrophones] = useState<{ id: string; label: string }[]>([]);
  const [configuredSoftware, setConfiguredSoftware] = useState(0);

  useEffect(() => {
    // Load saved settings
    Promise.all([
      window.electronAPI?.store.get("microphone"),
      window.electronAPI?.store.get("theme"),
      window.electronAPI?.store.get("cabinet_name"),
      window.electronAPI?.store.get("auto_start"),
      window.electronAPI?.store.get("software_configs"),
    ]).then(([mic, th, cabinet, autoStartVal, swConfigs]) => {
      if (mic) setMicrophone(mic as string);
      if (th) setTheme(th as "light" | "dark");
      if (cabinet) setCabinetName(cabinet as string);
      if (autoStartVal) setAutoStart(autoStartVal as boolean);
      if (swConfigs && typeof swConfigs === "object") {
        const count = Object.values(swConfigs as Record<string, { enabled?: boolean }>)
          .filter((c) => c.enabled).length;
        setConfiguredSoftware(count);
      }
    });

    // List available microphones
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const mics = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({ id: d.deviceId, label: d.label || "Microphone" }));
      setMicrophones(mics);
    });
  }, []);

  async function handleSave() {
    await Promise.all([
      window.electronAPI?.store.set("microphone", microphone),
      window.electronAPI?.store.set("theme", theme),
      window.electronAPI?.store.set("auto_start", autoStart),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Parametres</h1>
      <p className="mt-1 text-sm text-slate-500">Parametres generaux de l&apos;application</p>

      <div className="mt-6 space-y-6">
        {/* Microphone */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Microphone</h2>
          <p className="mt-1 text-xs text-slate-500">
            Peripherique d&apos;entree audio pour la dictee vocale
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
          <p className="mt-1 text-xs text-slate-500">Apparence de l&apos;application</p>
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

        {/* Auto-start */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Demarrage automatique</h2>
              <p className="mt-1 text-xs text-slate-500">
                Lancer la Passerelle au demarrage de Windows/macOS
              </p>
            </div>
            <button
              onClick={() => setAutoStart(!autoStart)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                autoStart ? "bg-[#c96442]" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  autoStart ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
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
            <div className="flex justify-between">
              <span className="text-slate-500">Logiciels configures</span>
              <span className="font-medium text-slate-900">{configuredSoftware}</span>
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
