import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="eyebrow">Niet gevonden</p>
      <h1 className="font-display text-3xl font-semibold text-ink">
        Deze sessie bestaat niet (meer)
      </h1>
      <p className="max-w-md text-sm text-ink-muted">
        De opgevraagde analyse is niet gevonden. Start een nieuwe risicoanalyse
        vanaf het beginscherm.
      </p>
      <Link
        href="/"
        className="mt-2 border rounded border-kobalt bg-kobalt px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-kobalt-diep"
      >
        Naar het startscherm
      </Link>
    </div>
  );
}
