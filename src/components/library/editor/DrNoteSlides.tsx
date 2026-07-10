"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Settings2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Type,
  CaseSensitive,
  Palette,
  X,
  Stethoscope,
  FlaskConical,
} from "lucide-react";
import type { Slide, SlideDeck } from "@/lib/article-to-slides";

const THEMES = {
  paper: {
    name: "Paper",
    bg: "#FBFAF6",
    surface: "#FFFFFF",
    ink: "#1F2A2E",
    muted: "#6B7A80",
    accent: "#0F766E",
    accentSoft: "#E4F1EF",
    rule: "#E7E4DA",
  },
  clinical: {
    name: "Clinical",
    bg: "#F5F8FB",
    surface: "#FFFFFF",
    ink: "#132A3D",
    muted: "#5F7386",
    accent: "#1D6FB8",
    accentSoft: "#E3EEF8",
    rule: "#DCE5EE",
  },
  mint: {
    name: "Mint",
    bg: "#F3FAF6",
    surface: "#FFFFFF",
    ink: "#15332B",
    muted: "#5E7A70",
    accent: "#0E8A6D",
    accentSoft: "#E0F3EC",
    rule: "#D9EAE2",
  },
  slate: {
    name: "Slate",
    bg: "#F7F7FA",
    surface: "#FFFFFF",
    ink: "#24243A",
    muted: "#6C6C84",
    accent: "#4F46B8",
    accentSoft: "#E9E8F8",
    rule: "#E4E4EE",
  },
  sand: {
    name: "Sand",
    bg: "#FAF6F0",
    surface: "#FFFFFF",
    ink: "#332A22",
    muted: "#7C6E5E",
    accent: "#B5642A",
    accentSoft: "#F4E7DA",
    rule: "#EBE2D5",
  },
} as const;

type ThemeKey = keyof typeof THEMES;

const FONTS = {
  sans: { name: "Sans", stack: "ui-sans-serif, 'Inter', 'Segoe UI', system-ui, sans-serif" },
  serif: { name: "Serif", stack: "'Source Serif 4', 'Charter', Georgia, serif" },
  slab: { name: "Slab", stack: "'Roboto Slab', 'Rockwell', 'Source Serif 4', serif" },
  grotesk: { name: "Grotesk", stack: "'Space Grotesk', 'Inter', system-ui, sans-serif" },
} as const;

type FontKey = keyof typeof FONTS;

const SIZES = {
  sm: { name: "S", scale: 0.9 },
  md: { name: "M", scale: 1 },
  lg: { name: "L", scale: 1.16 },
} as const;

type SizeKey = keyof typeof SIZES;

function SlidesLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: "var(--accent)", color: "#FFFFFF" }}
      >
        <Stethoscope size={17} strokeWidth={2.2} />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className="text-[15px] font-bold tracking-tight"
          style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}
        >
          DrNote
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--muted)" }}
        >
          Medical Library
        </span>
      </span>
    </div>
  );
}

export function DrNoteSlides({
  deck,
  onExit,
}: {
  deck: SlideDeck;
  onExit?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [headFont, setHeadFont] = useState<FontKey>("grotesk");
  const [bodyFont, setBodyFont] = useState<FontKey>("sans");
  const [size, setSize] = useState<SizeKey>("md");
  const [themeKey, setThemeKey] = useState<ThemeKey>("paper");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[themeKey];
  const total = deck.slides.length;
  const slide = deck.slides[index];

  const next = useCallback(
    () => setIndex((i) => Math.min(i + 1, total - 1)),
    [total]
  );
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => undefined);
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
        onExit?.();
        return;
      }
      if (settingsOpen && (e.target as HTMLElement | null)?.closest?.("[data-settings]")) {
        return;
      }
      switch (e.key) {
        case " ":
        case "Enter":
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "PageUp":
        case "Backspace":
          e.preventDefault();
          prev();
          break;
        case "Home":
          setIndex(0);
          break;
        case "End":
          setIndex(total - 1);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, total, toggleFullscreen, settingsOpen, onExit]);

  const cssVars = useMemo(
    () =>
      ({
        "--bg": theme.bg,
        "--surface": theme.surface,
        "--ink": theme.ink,
        "--muted": theme.muted,
        "--accent": theme.accent,
        "--accent-soft": theme.accentSoft,
        "--rule": theme.rule,
        "--font-head": FONTS[headFont].stack,
        "--font-body": FONTS[bodyFont].stack,
        "--scale": SIZES[size].scale,
      }) as CSSProperties,
    [theme, headFont, bodyFont, size]
  );

  if (!slide) return null;

  const sectionLabel =
    "section" in slide && slide.section ? slide.section : "Overview";

  return (
    <div
      ref={rootRef}
      style={{ ...cssVars, background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--font-body)" }}
      className="fixed inset-0 z-[100] flex flex-col select-none overflow-hidden"
    >
      <div className="h-1 w-full shrink-0" style={{ background: "var(--rule)" }}>
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${((index + 1) / total) * 100}%`,
            background: "var(--accent)",
          }}
        />
      </div>

      <header
        className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3"
        style={{ borderColor: "var(--rule)", background: "var(--surface)" }}
      >
        <SlidesLogo />

        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
          <span
            className="truncate text-[15px] font-bold leading-tight"
            style={{ fontFamily: "var(--font-head)", color: "var(--ink)" }}
          >
            {deck.topic}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--accent)" }}
          >
            {deck.specialty ? `${deck.specialty} · ` : ""}
            {sectionLabel}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {index + 1} / {total}
          </span>

          <div className="relative" data-settings>
            <IconButton
              label="Display settings"
              active={settingsOpen}
              onClick={() => setSettingsOpen((o) => !o)}
            >
              <Settings2 size={16} strokeWidth={2} />
            </IconButton>
            {settingsOpen ? (
              <SettingsPanel
                headFont={headFont}
                setHeadFont={setHeadFont}
                bodyFont={bodyFont}
                setBodyFont={setBodyFont}
                size={size}
                setSize={setSize}
                themeKey={themeKey}
                setThemeKey={setThemeKey}
                isFullscreen={isFullscreen}
                toggleFullscreen={toggleFullscreen}
              />
            ) : null}
          </div>

          {onExit ? (
            <IconButton label="Exit presentation" onClick={onExit}>
              <X size={16} strokeWidth={2} />
            </IconButton>
          ) : null}
        </div>
      </header>

      <main
        className="relative min-h-0 flex-1 cursor-pointer px-8 py-8 sm:px-16 lg:px-28"
        onClick={() => {
          if (settingsOpen) setSettingsOpen(false);
          else next();
        }}
      >
        <SlideView slide={slide} />
      </main>

      <footer
        className="flex shrink-0 items-center justify-between border-t px-6 py-3"
        style={{ borderColor: "var(--rule)", background: "var(--surface)" }}
      >
        <span className="text-[11px]" style={{ color: "var(--muted)" }}>
          Press Space or Enter for the next slide
        </span>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <span
            className="text-[11px] font-semibold tabular-nums"
            style={{ color: "var(--muted)" }}
          >
            Slide {index + 1} of {total}
          </span>
          <div className="flex items-center gap-1.5">
            <IconButton label="Previous slide" onClick={prev} disabled={index === 0}>
              <ChevronLeft size={16} strokeWidth={2} />
            </IconButton>
            <IconButton
              label="Next slide"
              onClick={next}
              disabled={index === total - 1}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </IconButton>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SlideView({ slide }: { slide: Slide }) {
  return (
    <div className="drnote-slide-in mx-auto flex h-full w-full max-w-5xl flex-col justify-center">
      {renderSlide(slide)}
    </div>
  );
}

function renderSlide(slide: Slide) {
  switch (slide.type) {
    case "title":
      return (
        <div className="max-w-3xl">
          {slide.eyebrow ? <Eyebrow>{slide.eyebrow}</Eyebrow> : null}
          <h1
            className="mt-5 font-bold leading-[1.05] tracking-tight"
            style={{
              fontFamily: "var(--font-head)",
              fontSize: "calc(var(--scale) * 3.6rem)",
            }}
          >
            {slide.title}
          </h1>
          {slide.subtitle ? (
            <p
              className="mt-5 leading-relaxed"
              style={{
                color: "var(--muted)",
                fontSize: "calc(var(--scale) * 1.18rem)",
              }}
            >
              {slide.subtitle}
            </p>
          ) : null}
          <span
            className="mt-8 block h-1.5 w-16 rounded-full"
            style={{ background: "var(--accent)" }}
          />
        </div>
      );
    case "points":
      return (
        <div className="max-w-3xl">
          <SlideHeading title={slide.title} />
          <ul className="mt-8 space-y-5">
            {slide.points.map((p, i) => (
              <li key={i} className="grid grid-cols-[auto_1fr] items-start gap-x-4">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    fontFamily: "var(--font-head)",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  className="leading-relaxed"
                  style={{ fontSize: "calc(var(--scale) * 1.28rem)" }}
                >
                  {p}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "fact":
      return (
        <div className="max-w-3xl">
          <SlideHeading title={slide.title} />
          <div
            className="mt-8 inline-flex flex-col rounded-2xl border px-10 py-8"
            style={{ borderColor: "var(--rule)", background: "var(--surface)" }}
          >
            <span
              className="font-bold leading-none tracking-tight"
              style={{
                color: "var(--accent)",
                fontFamily: "var(--font-head)",
                fontSize: "calc(var(--scale) * 4.6rem)",
              }}
            >
              {slide.stat}
            </span>
            <span
              className="mt-3 text-sm font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--muted)" }}
            >
              {slide.statLabel}
            </span>
          </div>
          {slide.note ? (
            <p
              className="mt-6 max-w-xl leading-relaxed"
              style={{
                color: "var(--muted)",
                fontSize: "calc(var(--scale) * 1.05rem)",
              }}
            >
              {slide.note}
            </p>
          ) : null}
        </div>
      );
    case "table":
      return (
        <div className="w-full max-w-4xl">
          <SlideHeading title={slide.title} />
          <div
            className="mt-8 overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--rule)", background: "var(--surface)" }}
          >
            <table
              className="w-full border-collapse"
              style={{ fontSize: "calc(var(--scale) * 1.02rem)" }}
            >
              <thead>
                <tr style={{ background: "var(--accent-soft)" }}>
                  {slide.columns.map((c, i) => (
                    <th
                      key={i}
                      className="px-5 py-3 text-left text-[0.8em] font-bold uppercase tracking-[0.08em]"
                      style={{ color: "var(--accent)", fontFamily: "var(--font-head)" }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slide.rows.map((row, r) => (
                  <tr key={r} className="border-t" style={{ borderColor: "var(--rule)" }}>
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className="px-5 py-3.5 align-top leading-snug"
                        style={c === 0 ? { fontWeight: 700 } : undefined}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {slide.caption ? (
            <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
              {slide.caption}
            </p>
          ) : null}
        </div>
      );
    case "twoCol":
      return (
        <div className="w-full max-w-4xl">
          <SlideHeading title={slide.title} />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[slide.left, slide.right].map((col, i) => (
              <div
                key={i}
                className="rounded-xl border p-6"
                style={{ borderColor: "var(--rule)", background: "var(--surface)" }}
              >
                <h3
                  className="text-sm font-bold uppercase tracking-[0.1em]"
                  style={{ color: "var(--accent)", fontFamily: "var(--font-head)" }}
                >
                  {col.heading}
                </h3>
                <ul className="mt-4 space-y-3">
                  {col.points.map((p, j) => (
                    <li key={j} className="grid grid-cols-[auto_1fr] items-start gap-x-3">
                      <span
                        className="mt-[0.5em] h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--accent)" }}
                      />
                      <span
                        className="leading-relaxed"
                        style={{ fontSize: "calc(var(--scale) * 1.08rem)" }}
                      >
                        {p}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    case "image":
      return (
        <div className="w-full max-w-4xl">
          <SlideHeading title={slide.title} />
          <figure
            className="mt-6 overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--rule)", background: "var(--surface)" }}
          >
            <div
              className="flex items-center justify-center p-4"
              style={{ background: "var(--accent-soft)" }}
            >
              <img
                src={slide.src}
                alt={slide.alt ?? slide.title}
                className="max-h-[46vh] w-auto object-contain"
                loading="lazy"
              />
            </div>
            {slide.caption ? (
              <figcaption
                className="border-t px-5 py-3 text-sm"
                style={{ borderColor: "var(--rule)", color: "var(--muted)" }}
              >
                {slide.caption}
              </figcaption>
            ) : null}
          </figure>
        </div>
      );
    case "end":
      return (
        <div className="max-w-3xl">
          <span
            className="block h-1.5 w-16 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <h1
            className="mt-8 font-bold leading-tight tracking-tight"
            style={{
              fontFamily: "var(--font-head)",
              fontSize: "calc(var(--scale) * 2.9rem)",
            }}
          >
            {slide.title}
          </h1>
          {slide.subtitle ? (
            <p
              className="mt-4 leading-relaxed"
              style={{
                color: "var(--muted)",
                fontSize: "calc(var(--scale) * 1.1rem)",
              }}
            >
              {slide.subtitle}
            </p>
          ) : null}
        </div>
      );
  }
}

function SlideHeading({ title }: { title: string }) {
  return (
    <h2
      className="font-bold leading-tight tracking-tight"
      style={{
        fontFamily: "var(--font-head)",
        fontSize: "calc(var(--scale) * 2.35rem)",
      }}
    >
      {title}
    </h2>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
      style={{
        borderColor: "var(--rule)",
        background: "var(--surface)",
        color: "var(--accent)",
        fontFamily: "var(--font-head)",
      }}
    >
      <FlaskConical size={12} strokeWidth={2.2} />
      {children}
    </span>
  );
}

function SettingsPanel({
  headFont,
  setHeadFont,
  bodyFont,
  setBodyFont,
  size,
  setSize,
  themeKey,
  setThemeKey,
  isFullscreen,
  toggleFullscreen,
}: {
  headFont: FontKey;
  setHeadFont: (v: FontKey) => void;
  bodyFont: FontKey;
  setBodyFont: (v: FontKey) => void;
  size: SizeKey;
  setSize: (v: SizeKey) => void;
  themeKey: ThemeKey;
  setThemeKey: (v: ThemeKey) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}) {
  const fontOptions = (Object.keys(FONTS) as FontKey[]).map((k) => ({
    key: k,
    label: FONTS[k].name,
  }));

  return (
    <div
      role="dialog"
      aria-label="Display settings"
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-11 z-10 w-80 rounded-xl border p-4 shadow-xl"
      style={{ borderColor: "var(--rule)", background: "var(--surface)" }}
    >
      <SettingRow icon={<CaseSensitive size={14} strokeWidth={2} />} label="Heading font">
        <Segmented options={fontOptions} value={headFont} onChange={setHeadFont} />
      </SettingRow>
      <SettingRow icon={<Type size={14} strokeWidth={2} />} label="Body font">
        <Segmented options={fontOptions} value={bodyFont} onChange={setBodyFont} />
      </SettingRow>
      <SettingRow icon={<Type size={14} strokeWidth={2} />} label="Text size">
        <Segmented
          options={(Object.keys(SIZES) as SizeKey[]).map((k) => ({
            key: k,
            label: SIZES[k].name,
          }))}
          value={size}
          onChange={setSize}
        />
      </SettingRow>
      <SettingRow icon={<Palette size={14} strokeWidth={2} />} label="Background">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
            <button
              key={k}
              type="button"
              title={THEMES[k].name}
              aria-label={`${THEMES[k].name} theme`}
              aria-pressed={themeKey === k}
              onClick={() => setThemeKey(k)}
              className="h-8 w-8 rounded-full border-2 transition-transform focus-visible:outline focus-visible:outline-2"
              style={{
                background: THEMES[k].bg,
                borderColor: themeKey === k ? THEMES[k].accent : "var(--rule)",
                transform: themeKey === k ? "scale(1.1)" : undefined,
                outlineColor: "var(--accent)",
              }}
            >
              <span
                className="mx-auto block h-2.5 w-2.5 rounded-full"
                style={{ background: THEMES[k].accent }}
              />
            </button>
          ))}
        </div>
      </SettingRow>
      <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--rule)" }}>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors hover:opacity-80 focus-visible:outline focus-visible:outline-2"
          style={{
            borderColor: "var(--rule)",
            color: "var(--ink)",
            outlineColor: "var(--accent)",
          }}
        >
          {isFullscreen ? (
            <Minimize2 size={14} strokeWidth={2} />
          ) : (
            <Maximize2 size={14} strokeWidth={2} />
          )}
          {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        </button>
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div
        className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
        style={{ color: "var(--muted)" }}
      >
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: T; label: string }>;
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div
      className="inline-flex flex-wrap rounded-lg border p-0.5"
      style={{ borderColor: "var(--rule)", background: "var(--bg)" }}
      role="radiogroup"
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.key)}
            className="rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "#FFFFFF" : "var(--muted)",
              outlineColor: "var(--accent)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  active,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:opacity-80 disabled:opacity-35 focus-visible:outline focus-visible:outline-2"
      style={{
        borderColor: "var(--rule)",
        background: active ? "var(--accent-soft)" : "var(--surface)",
        color: active ? "var(--accent)" : "var(--ink)",
        outlineColor: "var(--accent)",
      }}
    >
      {children}
    </button>
  );
}

// Slide animation in globals.css (.drnote-slide-in)
