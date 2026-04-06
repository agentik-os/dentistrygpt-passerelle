import { useState } from "react";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authCode, setAuthCode] = useState("");

  const handleOpenBrowser = async () => {
    setLoading(true);
    setError("");
    try {
      await window.electronAPI?.auth.login();
    } catch {
      setError("Impossible d'ouvrir le navigateur");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCode.trim()) return;
    setError("");
    setLoading(true);

    try {
      const result = await window.electronAPI?.auth.exchangeToken(authCode.trim());
      if (result?.success) {
        onLogin();
      } else {
        setError(result?.error || "Code d'autorisation invalide");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c96442] text-2xl font-bold text-white">
            D
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">DentistryGPT</h1>
          <p className="text-sm text-slate-500">Passerelle Desktop</p>
        </div>

        {/* Auth flow */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="space-y-4">
            {/* Step 1: Open browser */}
            <button
              type="button"
              onClick={handleOpenBrowser}
              disabled={loading}
              className="w-full rounded-lg bg-[#c96442] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b55638] disabled:opacity-50"
            >
              Se connecter via DentistryGPT
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">puis</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Step 2: Paste code */}
            <form onSubmit={handleCodeSubmit} className="space-y-3">
              <div>
                <label htmlFor="auth-code" className="mb-1 block text-sm font-medium text-slate-700">
                  Code d'autorisation
                </label>
                <input
                  id="auth-code"
                  type="text"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-[#c96442] focus:ring-2 focus:ring-[#c96442]/20"
                  placeholder="Collez le code ici"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !authCode.trim()}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {loading ? "Connexion..." : "Valider le code"}
              </button>
            </form>
          </div>

          {/* Login flow helper */}
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-medium text-slate-600">Comment se connecter :</span><br />
              1. Cliquez sur <strong>Se connecter</strong> — votre navigateur s&apos;ouvre sur DentistryGPT.<br />
              2. Connectez-vous avec votre compte Google habituel.<br />
              3. Copiez le code d&apos;autorisation affich&eacute;.<br />
              4. Collez-le ici et cliquez <strong>Valider</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          DentistryGPT Passerelle v1.0
        </p>
      </div>
    </div>
  );
}
