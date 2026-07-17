import { LEVEL_INFO, type CadaLevel } from "@/lib/cada";
import { StartForm } from "@/components/StartForm";
import { Ladder } from "@/components/Ladder";

export default function Home() {
  const levels = [1, 2, 3, 4] as CadaLevel[];

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      {/* Linkerpaneel: het instrument en de ladder */}
      <section className="on-dark bg-nacht text-white lg:w-[55%]">
        <div className="mx-auto flex h-full max-w-2xl flex-col justify-between gap-12 px-6 py-10 lg:px-12 lg:py-14">
          <div>
            <p className="rise-in font-mono text-[11px] uppercase tracking-[0.18em] text-kobalt-200">
              Cloud and AI Development Act · augustus 2026
            </p>
            <div className="mt-8 flex items-end gap-6">
              <Ladder level={4} size="lg" animate />
              <h1 className="rise-in font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
                CADA Sovereignty
                <br />
                Navigator
              </h1>
            </div>
            <p
              className="rise-in mt-6 max-w-lg text-[15px] leading-relaxed text-kobalt-100"
              style={{ animationDelay: "0.15s" }}
            >
              De CADA verplicht overheidsinstanties om per cloudtoepassing te
              bepalen welk soevereiniteitsniveau van toepassing is. Deze
              navigator begeleidt u door dat proces in vier stappen: profileer
              uw toepassingen, toets uw leveranciers, ontvang een gap-rapport
              met roadmap en exporteer het resultaat.
            </p>
          </div>

          <div className="rise-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-kobalt-200">
              De soevereiniteitsladder — vier niveaus
            </h2>
            <dl className="mt-4 divide-y divide-white/12 border-y border-white/12">
              {levels.map((level) => (
                <div key={level} className="flex items-start gap-4 py-3">
                  <dt className="flex w-36 shrink-0 items-center gap-2.5 sm:w-44">
                    <Ladder level={level} />
                    <span>
                      <span className="font-mono text-sm font-medium">
                        N{level}
                      </span>
                      <span className="block font-display text-sm font-semibold leading-snug">
                        {LEVEL_INFO[level].name}
                      </span>
                    </span>
                  </dt>
                  <dd className="text-sm leading-snug text-kobalt-100">
                    {LEVEL_INFO[level].description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Rechterpaneel: dossier openen */}
      <section className="flex flex-1 items-center bg-porselein">
        <div className="mx-auto w-full max-w-md px-6 py-12 lg:px-10">
          <div className="rounded-lg border border-line bg-wit p-6 shadow-[0_1px_2px_rgba(11,21,65,0.06)] sm:p-8">
            <p className="eyebrow">Stap 1 van 4 · Voorbereiding</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
              Open een dossier
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
