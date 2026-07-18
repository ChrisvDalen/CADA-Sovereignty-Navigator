import Link from "next/link";

export function StepNav({
  backHref,
  backLabel,
  nextHref,
  nextLabel,
  nextDisabled = false,
  nextDisabledReason,
}: {
  backHref?: string;
  backLabel?: string;
  nextHref?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextDisabledReason?: string;
}) {
  return (
    <div className="no-print mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded border border-line-strong bg-wit px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-kobalt hover:text-kobalt"
          >
            <span aria-hidden>←</span>
            {backLabel ?? "Vorige stap"}
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        {nextDisabled && nextDisabledReason && (
          <span className="text-xs text-ink-muted">{nextDisabledReason}</span>
        )}
        {nextHref &&
          (nextDisabled ? (
            <span className="inline-flex cursor-not-allowed items-center gap-2 rounded border border-line bg-porselein px-4 py-2 text-sm font-medium text-ink-faint">
              {nextLabel ?? "Volgende stap"}
              <span aria-hidden>→</span>
            </span>
          ) : (
            <Link
              href={nextHref}
              className="inline-flex items-center gap-2 rounded border border-kobalt bg-kobalt px-4 py-2 text-sm font-medium text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep"
            >
              {nextLabel ?? "Volgende stap"}
              <span aria-hidden>→</span>
            </Link>
          ))}
      </div>
    </div>
  );
}
