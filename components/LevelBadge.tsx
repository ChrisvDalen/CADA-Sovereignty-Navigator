import { LEVEL_INFO, type CadaLevel } from "@/lib/cada";

const STYLES: Record<CadaLevel, string> = {
  1: "bg-navy-50 text-navy-600 border-navy-200",
  2: "bg-navy-100 text-navy-700 border-navy-300",
  3: "bg-navy-600 text-white border-navy-600",
  4: "bg-navy-900 text-white border-navy-900",
};

export function LevelBadge({
  level,
  showName = false,
  size = "md",
}: {
  level: CadaLevel;
  showName?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-[family-name:var(--font-mono)] font-medium ${STYLES[level]} ${
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs"
      }`}
    >
      N{level}
      {showName && (
        <span className="tracking-wide uppercase">{LEVEL_INFO[level].name}</span>
      )}
    </span>
  );
}
