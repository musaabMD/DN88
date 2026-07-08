export function DrNoteLogo({
  size = "md",
  showWordmark = false,
  forceWordmark = false,
}: {
  size?: "sm" | "md";
  showWordmark?: boolean;
  /** Always show Drnote wordmark, including on small screens. */
  forceWordmark?: boolean;
}) {
  const box = size === "sm" ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl";
  const letter = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <div
        className={`flex ${box} shrink-0 items-center justify-center`}
        style={{
          background: "linear-gradient(135deg,#58CC02,#46A302)",
          boxShadow: "0 2px 0 #3a8200",
        }}
      >
        <span className={`${letter} font-black leading-none text-white`}>D</span>
      </div>
      {showWordmark ? (
        <span
          className={`truncate text-lg font-extrabold tracking-tight text-slate-900 ${forceWordmark ? "block" : "hidden sm:block"}`}
          style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
        >
          Drnote
        </span>
      ) : null}
    </div>
  );
}
