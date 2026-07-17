import { LEVEL_INFO, type CadaLevel } from "@/lib/cada";
import { Ladder } from "@/components/Ladder";

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
      title={LEVEL_INFO[level].title}
      className={`inline-flex items-center gap-1.5 rounded border border-line bg-wit font-mono font-medium text-ink ${
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs"
      }`}
    >
      <Ladder level={level} />
      N{level}
      {showName && (
        <span className="tracking-wide uppercase text-ink-muted">
          {LEVEL_INFO[level].name}
        </span>
      )}
    </span>
  );
}
