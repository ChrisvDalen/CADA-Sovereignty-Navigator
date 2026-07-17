"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "cada-assessment-id";

interface ResumeInfo {
  id: string;
  orgName: string;
  applicationCount: number;
}

export function StartForm() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeInfo | null>(null);

  useEffect(() => {
    const savedId = window.localStorage.getItem(STORAGE_KEY);
    if (!savedId) return;
    fetch(`/api/assessments/${savedId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.id) {
          setResume({
            id: data.id,
            orgName: data.orgName,
            applicationCount: data.applications?.length ?? 0,
          });
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName: orgName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Er ging iets mis.");
      window.localStorage.setItem(STORAGE_KEY, data.id);
      router.push(`/assessment/${data.id}/toepassingen`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="orgName"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Naam van uw organisatie
          </label>
          <input
            id="orgName"
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Bijv. Gemeente Utrecht"
            autoComplete="organization"
            className="w-full border border-line-strong bg-card px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-navy-600"
          />
        </div>
        {error && (
          <p className="border border-alert/30 bg-alert-bg px-3 py-2 text-sm text-alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!orgName.trim() || busy}
          className="w-full border border-navy-600 bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:border-line disabled:bg-paper disabled:text-ink-faint"
        >
          {busy ? "Bezig met starten…" : "Start de risicoanalyse"}
        </button>
      </form>

      {resume && (
        <div className="border border-line bg-paper px-4 py-3">
          <p className="eyebrow mb-1">Eerdere sessie gevonden</p>
          <p className="text-sm text-ink">
            <span className="font-semibold">{resume.orgName}</span>
            {" — "}
            {resume.applicationCount === 1
              ? "1 toepassing"
              : `${resume.applicationCount} toepassingen`}{" "}
            geprofileerd.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/assessment/${resume.id}/toepassingen`)}
            className="mt-2 text-sm font-semibold text-navy-600 underline underline-offset-4 hover:text-navy-700"
          >
            Sessie hervatten →
          </button>
        </div>
      )}
    </div>
  );
}
