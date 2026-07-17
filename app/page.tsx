import { LEVEL_INFO, type CadaLevel } from "@/lib/cada";
import { StartForm } from "@/components/StartForm";

export default function Home() {
  const levels = [1, 2, 3, 4] as CadaLevel[];

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      {/* Linkerpaneel: context en de vier niveaus */}
      <section className="bg-navy-600 text-white lg:w-[55%]">
        <div className="mx-auto flex h-full max-w-2xl flex-col justify-between gap-12 px-6 py-10 lg:px-12 lg:py-14">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-navy-200">
              Cloud and AI Development Act · augustus 2026
            </p>
            <h1 className="mt-6 font-[family-name:var(--font-serif)] text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              CADA Sovereignty
              <br />
              <span className="italic font-normal">Navigator</span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-navy-100">
              De CADA (Cloud and AI Development Act) verplicht overheidsinstanties
              om per cloudtoepassing te bepalen welk soevereiniteitsniveau van
              toepassing is. Deze tool begeleidt u door dat proces in vier stappen:
              profileer uw toepassingen, toets uw leveranciers, ontvang een
              gap-rapport met roadmap en exporteer het resultaat.
            </p>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-navy-200">
              De vier soevereiniteitsniveaus
            </h2>
            <dl className="mt-4 divide-y divide-white/15 border-y border-white/15">
              {levels.map((level) => (
                <div key={level} className="flex gap-4 py-3">
                  <dt className="w-32 shrink-0 sm:w-40">
                    <span className="font-[family-name:var(--font-mono)] text-sm font-medium">
                      N{level}
                    </span>
                    <span className="block text-sm font-semibold leading-snug">
                      {LEVEL_INFO[level].name}
                    </span>
                  </dt>
                  <dd className="text-sm leading-snug text-navy-100">
                    {LEVEL_INFO[level].description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Rechterpaneel: startformulier */}
      <section className="flex flex-1 items-center bg-paper">
        <div className="mx-auto w-full max-w-md px-6 py-12 lg:px-10">
          <div className="border border-line bg-card p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:p-8">
            <p className="eyebrow">Stap 1 van 4 · Voorbereiding</p>
            <h2 className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-semibold text-ink">
              Begin uw risicoanalyse
            </h2>
            <p className="mt-2 mb-6 text-sm text-ink-muted">
              Vul de naam van uw organisatie in. Uw voortgang wordt automatisch
              bewaard, zodat u de analyse later kunt hervatten.
            </p>
            <StartForm />
          </div>
          <p className="mt-4 px-1 text-xs leading-relaxed text-ink-muted">
            Dit instrument is indicatief. Raadpleeg altijd een juridisch adviseur
            voor een bindende interpretatie van de CADA.
          </p>
        </div>
      </section>
    </div>
  );
}
