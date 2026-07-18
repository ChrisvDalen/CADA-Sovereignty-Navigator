import type { CadaLevel } from "@/lib/cada";

/**
 * De Soevereiniteitsladder: vier oplopende balken, goud gevuld tot en met
 * het niveau. Dit glyph is de enige plek in de interface waar goud
 * voorkomt — de kleur zelf codeert dus het soevereiniteitsniveau.
 */
export function Ladder({
  level,
  size = "sm",
  animate = false,
}: {
  level: CadaLevel;
  size?: "sm" | "lg";
  animate?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`ladder ${size === "lg" ? "ladder-lg" : ""} ${
        animate ? "ladder-animate" : ""
      }`}
    >
      {([1, 2, 3, 4] as const).map((step) => (
        <i key={step} className={step <= level ? "vol" : "leeg"} />
      ))}
    </span>
  );
}
