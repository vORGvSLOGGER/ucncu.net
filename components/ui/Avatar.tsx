const PALETTES = [
  ["#f5c451", "#b98a1e"],
  ["#2dd4bf", "#0d9488"],
  ["#a78bfa", "#7c3aed"],
  ["#60a5fa", "#2563eb"],
  ["#f87171", "#dc2626"],
  ["#fb923c", "#ea580c"],
  ["#4ade80", "#16a34a"],
  ["#22d3ee", "#0891b2"],
  ["#f472b6", "#db2777"],
  ["#facc15", "#ca8a04"],
  ["#94a3b8", "#475569"],
  ["#34d399", "#059669"],
];

export function Avatar({
  name,
  avatarId = 0,
  size = 40,
  ring = false,
  ringColor,
}: {
  name: string;
  avatarId?: number;
  size?: number;
  ring?: boolean;
  /** perk frame color — overrides the default gold ring */
  ringColor?: string | null;
}) {
  const [c1, c2] = PALETTES[Math.abs(avatarId) % PALETTES.length];
  const letter = name.trim().charAt(0) || "؟";
  const ringStyle =
    ring && ringColor
      ? { boxShadow: `0 0 0 2px ${ringColor}, 0 0 14px ${ringColor}66` }
      : undefined;
  return (
    <div
      className={`relative grid shrink-0 place-items-center rounded-full font-bold text-bg ${
        ring && !ringColor ? "ring-2 ring-gold/70 shadow-[0_0_14px_rgba(245,196,81,0.35)]" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        fontSize: size * 0.42,
        ...ringStyle,
      }}
    >
      {letter}
    </div>
  );
}
