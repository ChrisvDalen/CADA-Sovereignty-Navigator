import Link from "next/link";
import { WIZARD_STEPS } from "@/lib/cada";

export function WizardShell({
  assessmentId,
  orgName,
  currentStep,
  children,
}: {
  assessmentId: string;
  orgName: string;
  currentStep: number; // 1 t/m 4
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navy-600 text-white">
        <div className="mx-auto flex w-full max-w-5xl items-baseline justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-[family-name:var(--font-serif)] text-lg font-semibold tracking-tight">
              CADA <span className="font-normal italic">Sovereignty Navigator</span>
            </span>
          </Link>
          <span
            className="hidden truncate font-[family-name:var(--font-mono)] text-xs text-navy-200 sm:block"
            title={orgName}
          >
            {orgName}
          </span>
        </div>
      </header>

      <nav aria-label="Voortgang" className="border-b border-line bg-card">
        <div className="mx-auto w-full max-w-5xl px-6">
          <p className="eyebrow pt-4">
            Stap {currentStep} van {WIZARD_STEPS.length}
          </p>
          <ol className="flex flex-wrap gap-x-8 gap-y-1">
            {WIZARD_STEPS.map((step, i) => {
              const n = i + 1;
              const active = n === currentStep;
              const done = n < currentStep;
              return (
                <li key={step.slug}>
                  <Link
                    href={`/assessment/${assessmentId}/${step.slug}`}
                    aria-current={active ? "step" : undefined}
                    className={`flex items-baseline gap-2 border-b-2 pb-3 pt-2 text-sm transition-colors ${
                      active
                        ? "border-navy-600 font-semibold text-navy-600"
                        : done
                          ? "border-transparent text-ink hover:border-navy-200"
                          : "border-transparent text-ink-faint hover:border-line hover:text-ink-muted"
                    }`}
                  >
                    <span className="font-[family-name:var(--font-mono)] text-xs">
                      {String(n).padStart(2, "0")}
                    </span>
                    {step.label}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-baseline justify-between gap-2 px-6 py-4 text-xs text-ink-muted">
          <span>
            CADA Sovereignty Navigator — indicatief instrument, geen juridisch advies.
          </span>
          <span className="font-[family-name:var(--font-mono)]">
            Cloud and AI Development Act · van kracht per augustus 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
