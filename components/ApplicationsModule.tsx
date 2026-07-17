"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  berekenNiveau,
  DATA_TYPES,
  IMPACT_LEVELS,
  KNOWN_SUPPLIERS,
  OTHER_SUPPLIER,
  parseJsonArray,
  REGULATIONS,
  type CadaLevel,
  type DataTypeKey,
  type ImpactKey,
  type RegulationKey,
} from "@/lib/cada";
import type { ApplicationDto } from "@/lib/types";
import { LevelBadge } from "@/components/LevelBadge";

interface FormState {
  name: string;
  dataTypes: DataTypeKey[];
  regulations: RegulationKey[];
  impactLevel: ImpactKey | null;
  criticalInfra: boolean | null;
  suppliers: string[];
  supplierOther: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  dataTypes: [],
  regulations: [],
  impactLevel: null,
  criticalInfra: null,
  suppliers: [],
  supplierOther: "",
};

function toFormState(app: ApplicationDto): FormState {
  return {
    name: app.name,
    dataTypes: app.dataTypes,
    regulations: app.regulations,
    impactLevel: app.impactLevel,
    criticalInfra: app.criticalInfra,
    suppliers: app.suppliers,
    supplierOther: app.supplierOther,
  };
}

function rowToDto(row: {
  id: string;
  name: string;
  dataTypes: string;
  regulations: string;
  impactLevel: string;
  criticalInfra: boolean;
  suppliers: string;
  supplierOther: string;
  recommendedLevel: number;
}): ApplicationDto {
  return {
    id: row.id,
    name: row.name,
    dataTypes: parseJsonArray(row.dataTypes) as DataTypeKey[],
    regulations: parseJsonArray(row.regulations) as RegulationKey[],
    impactLevel: row.impactLevel as ImpactKey,
    criticalInfra: row.criticalInfra,
    suppliers: parseJsonArray(row.suppliers),
    supplierOther: row.supplierOther,
    recommendedLevel: row.recommendedLevel as CadaLevel,
  };
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ApplicationsModule({
  assessmentId,
  initialApplications,
}: {
  assessmentId: string;
  initialApplications: ApplicationDto[];
}) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [editingId, setEditingId] = useState<string | null>(null); // "new" of app-id
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formOpen = editingId !== null;

  const previewLevel = useMemo(() => {
    if (form.dataTypes.length === 0 || form.impactLevel === null) return null;
    return berekenNiveau({
      dataTypes: form.dataTypes,
      regulations: form.regulations,
      impactLevel: form.impactLevel,
      criticalInfra: form.criticalInfra === true,
    });
  }, [form]);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId("new");
    setError(null);
  }

  function openEdit(app: ApplicationDto) {
    setForm(toFormState(app));
    setEditingId(app.id);
    setError(null);
  }

  function closeForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const payload = {
      name: form.name,
      dataTypes: form.dataTypes,
      regulations: form.regulations,
      impactLevel: form.impactLevel,
      criticalInfra: form.criticalInfra === true,
      suppliers: form.suppliers,
      supplierOther: form.supplierOther,
    };

    try {
      const isNew = editingId === "new";
      const res = await fetch(
        isNew
          ? `/api/assessments/${assessmentId}/applications`
          : `/api/applications/${editingId}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Opslaan is niet gelukt.");

      const dto = rowToDto(data);
      setApplications((prev) =>
        isNew ? [...prev, dto] : prev.map((a) => (a.id === dto.id ? dto : a))
      );
      closeForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan is niet gelukt.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(app: ApplicationDto) {
    if (
      !window.confirm(
        `Weet u zeker dat u de toepassing "${app.name}" wilt verwijderen?`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/applications/${app.id}`, { method: "DELETE" });
    if (res.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
      if (editingId === app.id) closeForm();
      router.refresh();
    }
  }

  const inputBase =
    "w-full border border-line-strong bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-navy-600";

  return (
    <div className="space-y-8">
      {/* Overzicht van toegevoegde toepassingen */}
      {applications.length > 0 && (
        <div className="border border-line bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="eyebrow px-4 py-3 font-medium">Toepassing</th>
                <th className="eyebrow hidden px-4 py-3 font-medium md:table-cell">
                  Impact
                </th>
                <th className="eyebrow hidden px-4 py-3 font-medium md:table-cell">
                  Leveranciers
                </th>
                <th className="eyebrow px-4 py-3 font-medium">Niveau</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {applications.map((app) => {
                const impact = IMPACT_LEVELS.find(
                  (i) => i.key === app.impactLevel
                );
                const supplierNames = app.suppliers.map((s) =>
                  s === OTHER_SUPPLIER && app.supplierOther
                    ? app.supplierOther
                    : s
                );
                return (
                  <tr key={app.id} className="align-top">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-ink">{app.name}</span>
                      {app.criticalInfra && (
                        <span className="ml-2 border border-warn/40 bg-warn-bg px-1.5 py-0.5 text-[11px] font-medium text-warn">
                          Kritieke infra
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-ink-muted md:table-cell">
                      {impact?.label}
                    </td>
                    <td className="hidden max-w-56 px-4 py-3 text-ink-muted md:table-cell">
                      {supplierNames.join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      <LevelBadge level={app.recommendedLevel} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(app)}
                        className="text-sm font-medium text-navy-600 underline-offset-4 hover:underline"
                      >
                        Bewerken
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(app)}
                        className="ml-4 text-sm font-medium text-alert underline-offset-4 hover:underline"
                      >
                        Verwijderen
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!formOpen && (
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 border border-navy-600 bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          <span aria-hidden className="font-[family-name:var(--font-mono)]">+</span>
          Toepassing toevoegen
        </button>
      )}

      {/* Vragenlijst */}
      {formOpen && (
        <form
          onSubmit={handleSave}
          className="border border-line bg-card"
          aria-label="Toepassingsprofiel"
        >
          <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
            <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-ink">
              {editingId === "new"
                ? "Nieuwe toepassing profileren"
                : "Toepassing bewerken"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Annuleren
            </button>
          </div>

          <div className="space-y-8 px-5 py-6 sm:px-7">
            {/* 1. Naam */}
            <section>
              <label htmlFor="appName" className="block">
                <span className="eyebrow">Vraag 1 van 6</span>
                <span className="mt-1 block text-sm font-semibold text-ink">
                  Naam van de toepassing
                </span>
              </label>
              <input
                id="appName"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Bijv. Zaaksysteem, DMS, e-maildienst"
                className={`${inputBase} mt-2 max-w-md`}
              />
            </section>

            {/* 2. Type data */}
            <section>
              <p className="eyebrow">Vraag 2 van 6</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                Welk type data verwerkt deze toepassing?
              </p>
              <p className="text-xs text-ink-muted">
                Meerdere opties mogelijk.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {DATA_TYPES.map((dt) => {
                  const checked = form.dataTypes.includes(dt.key);
                  return (
                    <label
                      key={dt.key}
                      className={`flex cursor-pointer gap-3 border px-3 py-2.5 transition-colors ${
                        checked
                          ? "border-navy-600 bg-navy-50"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setForm({
                            ...form,
                            dataTypes: toggle(form.dataTypes, dt.key),
                          })
                        }
                        className="mt-1 h-3.5 w-3.5 shrink-0 accent-navy-600"
                      />
                      <span>
                        <span className="block text-sm font-medium text-ink">
                          {dt.label}
                        </span>
                        <span className="block text-xs leading-snug text-ink-muted">
                          {dt.hint}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* 3. Regelgeving */}
            <section>
              <p className="eyebrow">Vraag 3 van 6</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                Welke wet- en regelgeving is van toepassing?
              </p>
              <p className="text-xs text-ink-muted">Meerdere opties mogelijk.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {REGULATIONS.map((reg) => {
                  const checked = form.regulations.includes(reg.key);
                  return (
                    <label
                      key={reg.key}
                      className={`flex cursor-pointer items-center gap-3 border px-3 py-2.5 transition-colors ${
                        checked
                          ? "border-navy-600 bg-navy-50"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setForm({
                            ...form,
                            regulations: toggle(form.regulations, reg.key),
                          })
                        }
                        className="h-3.5 w-3.5 shrink-0 accent-navy-600"
                      />
                      <span className="text-sm font-medium text-ink">
                        {reg.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* 4. Impact */}
            <section>
              <p className="eyebrow">Vraag 4 van 6</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                Wat is de impact bij een datalek of uitval?
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {IMPACT_LEVELS.map((impact) => {
                  const checked = form.impactLevel === impact.key;
                  return (
                    <label
                      key={impact.key}
                      className={`flex cursor-pointer gap-3 border px-3 py-2.5 transition-colors ${
                        checked
                          ? "border-navy-600 bg-navy-50"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="impact"
                        checked={checked}
                        onChange={() =>
                          setForm({ ...form, impactLevel: impact.key })
                        }
                        className="mt-1 h-3.5 w-3.5 shrink-0 accent-navy-600"
                      />
                      <span>
                        <span className="block text-sm font-medium text-ink">
                          {impact.label}
                        </span>
                        <span className="block text-xs leading-snug text-ink-muted">
                          {impact.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* 5. Kritieke infrastructuur */}
            <section>
              <p className="eyebrow">Vraag 5 van 6</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                Is de toepassing onderdeel van kritieke infrastructuur?
              </p>
              <div className="mt-3 flex gap-2">
                {[
                  { value: true, label: "Ja" },
                  { value: false, label: "Nee" },
                ].map((opt) => {
                  const checked = form.criticalInfra === opt.value;
                  return (
                    <label
                      key={opt.label}
                      className={`flex cursor-pointer items-center gap-2.5 border px-5 py-2.5 transition-colors ${
                        checked
                          ? "border-navy-600 bg-navy-50"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="criticalInfra"
                        checked={checked}
                        onChange={() =>
                          setForm({ ...form, criticalInfra: opt.value })
                        }
                        className="h-3.5 w-3.5 accent-navy-600"
                      />
                      <span className="text-sm font-medium text-ink">
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* 6. Leveranciers */}
            <section>
              <p className="eyebrow">Vraag 6 van 6</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                Bij welke cloudleverancier(s) draait deze toepassing?
              </p>
              <p className="text-xs text-ink-muted">Meerdere opties mogelijk.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[...KNOWN_SUPPLIERS, OTHER_SUPPLIER].map((supplier) => {
                  const checked = form.suppliers.includes(supplier);
                  return (
                    <label
                      key={supplier}
                      className={`flex cursor-pointer items-center gap-3 border px-3 py-2.5 transition-colors ${
                        checked
                          ? "border-navy-600 bg-navy-50"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setForm({
                            ...form,
                            suppliers: toggle(form.suppliers, supplier),
                          })
                        }
                        className="h-3.5 w-3.5 shrink-0 accent-navy-600"
                      />
                      <span className="text-sm font-medium text-ink">
                        {supplier}
                      </span>
                    </label>
                  );
                })}
              </div>
              {form.suppliers.includes(OTHER_SUPPLIER) && (
                <input
                  type="text"
                  value={form.supplierOther}
                  onChange={(e) =>
                    setForm({ ...form, supplierOther: e.target.value })
                  }
                  placeholder="Naam van de andere leverancier"
                  aria-label="Naam van de andere leverancier"
                  className={`${inputBase} mt-2 max-w-md`}
                />
              )}
            </section>
          </div>

          {/* Voorlopige niveau-indicatie + acties */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-paper px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              {previewLevel !== null ? (
                <>
                  <LevelBadge level={previewLevel} showName />
                  <span className="text-xs text-ink-muted">
                    Voorlopige niveau-indicatie op basis van uw antwoorden.
                  </span>
                </>
              ) : (
                <span className="text-xs text-ink-muted">
                  Beantwoord de vragen om een niveau-indicatie te zien.
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {error && <span className="text-sm text-alert">{error}</span>}
              <button
                type="submit"
                disabled={busy}
                className="border border-navy-600 bg-navy-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
              >
                {busy
                  ? "Bezig met opslaan…"
                  : editingId === "new"
                    ? "Toepassing opslaan"
                    : "Wijzigingen opslaan"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
