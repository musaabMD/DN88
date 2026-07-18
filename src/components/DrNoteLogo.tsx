export function DrNoteLogo({
  size = "md",
  showWordmark = false,
  forceWordmark = false,
  lightWordmark = false,
}: {
  size?: "sm" | "md";
  showWordmark?: boolean;
  /** Always show Drnote wordmark, including on small screens. */
  forceWordmark?: boolean;
  /** White wordmark for dark header backgrounds. */
  lightWordmark?: boolean;
}) {
  const box = size === "sm" ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl";

  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <img
        src="/favicon.ico"
        alt="DrNote"
        width={size === "sm" ? 32 : 36}
        height={size === "sm" ? 32 : 36}
        className={`${box} shrink-0 object-contain`}
      />
      {showWordmark ? (
        <span
          className={`truncate text-lg font-extrabold tracking-tight ${lightWordmark ? "text-white" : "text-slate-900"} ${forceWordmark ? "block" : "hidden sm:block"}`}
          style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
        >
          Drnote
        </span>
      ) : null}
    </div>
  );
}
