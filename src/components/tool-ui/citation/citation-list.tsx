"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Globe,
  Code2,
  Newspaper,
  Database,
  File,
  ExternalLink,
} from "lucide-react";
import { cn, Popover, PopoverContent, PopoverTrigger } from "./_adapter";
import { Citation } from "./citation";
import type {
  SerializableCitation,
  CitationType,
  CitationVariant,
} from "./schema";
import {
  openSafeNavigationHref,
  resolveSafeNavigationHref,
} from "../shared/media";

const TYPE_ICONS: Record<CitationType, LucideIcon> = {
  webpage: Globe,
  document: FileText,
  article: Newspaper,
  api: Database,
  code: Code2,
  other: File,
};

const SITE_COLORS = [
  "#64748b",
  "#475569",
  "#334155",
  "#94a3b8",
  "#78716c",
  "#57534e",
];

function siteLabel(domain?: string, title?: string): string {
  const raw = (domain || title || "?").replace(/^www\./i, "");
  const segment = raw.split(".")[0] ?? raw;
  return segment.charAt(0).toUpperCase() || "?";
}

function siteColor(domain?: string, title?: string): string {
  const label = siteLabel(domain, title);
  const code = label.charCodeAt(0);
  return SITE_COLORS[code % SITE_COLORS.length] ?? SITE_COLORS[0];
}

function SiteBadge({
  citation,
  size = "sm",
  className,
}: {
  citation: SerializableCitation;
  size?: "sm" | "md";
  className?: string;
}) {
  const color = siteColor(citation.domain, citation.title);
  const label = siteLabel(citation.domain, citation.title);
  const dim = size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs";

  if (citation.favicon) {
    return (
      <img
        src={citation.favicon}
        alt=""
        aria-hidden="true"
        width={size === "sm" ? 18 : 24}
        height={size === "sm" ? 18 : 24}
        className={cn("shrink-0 rounded-full object-cover", dim, className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-extrabold text-white",
        dim,
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

export interface CitationListProps {
  id: string;
  citations: SerializableCitation[];
  variant?: CitationVariant;
  maxVisible?: number;
  className?: string;
  size?: "default" | "compact";
  onNavigate?: (href: string, citation: SerializableCitation) => void;
}

export function CitationList(props: CitationListProps) {
  const {
    id,
    citations,
    variant = "default",
    maxVisible,
    className,
    size = "default",
    onNavigate,
  } = props;

  const shouldTruncate =
    maxVisible !== undefined && citations.length > maxVisible;
  const visibleCitations = shouldTruncate
    ? citations.slice(0, maxVisible)
    : citations;
  const overflowCitations = shouldTruncate ? citations.slice(maxVisible) : [];
  const overflowCount = overflowCitations.length;

  const wrapperClass =
    variant === "inline"
      ? "flex flex-wrap items-center gap-1.5"
      : "flex flex-col gap-2";

  // Stacked variant: overlapping favicons with popover
  if (variant === "stacked") {
    return (
      <StackedCitations
        id={id}
        citations={citations}
        className={className}
        size={size}
        onNavigate={onNavigate}
      />
    );
  }

  if (variant === "default") {
    return (
      <div
        className={cn("isolate flex flex-col gap-4", className)}
        data-tool-ui-id={id}
        data-slot="citation-list"
      >
        {visibleCitations.map((citation) => (
          <Citation
            key={citation.id}
            {...citation}
            variant="default"
            onNavigate={onNavigate}
          />
        ))}
        {shouldTruncate && (
          <OverflowIndicator
            citations={overflowCitations}
            count={overflowCount}
            variant="default"
            onNavigate={onNavigate}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("isolate", wrapperClass, className)}
      data-tool-ui-id={id}
      data-slot="citation-list"
    >
      {visibleCitations.map((citation) => (
        <Citation
          key={citation.id}
          {...citation}
          variant={variant}
          onNavigate={onNavigate}
        />
      ))}
      {shouldTruncate && (
        <OverflowIndicator
          citations={overflowCitations}
          count={overflowCount}
          variant={variant}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

interface OverflowIndicatorProps {
  citations: SerializableCitation[];
  count: number;
  variant: CitationVariant;
  onNavigate?: (href: string, citation: SerializableCitation) => void;
}

function OverflowIndicator({
  citations,
  count,
  variant,
  onNavigate,
}: OverflowIndicatorProps) {
  const [open, setOpen] = React.useState(false);

  const handleClick = (citation: SerializableCitation) => {
    const href = resolveSafeNavigationHref(citation.href);
    if (!href) return;
    if (onNavigate) {
      onNavigate(href, citation);
    } else {
      openSafeNavigationHref(href);
    }
  };

  const popoverContent = (
    <div className="flex max-h-72 flex-col overflow-y-auto">
      {citations.map((citation) => (
        <OverflowItem
          key={citation.id}
          citation={citation}
          onClick={() => handleClick(citation)}
        />
      ))}
    </div>
  );

  if (variant === "inline") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<button type="button" onClick={() => setOpen((prev) => !prev)} className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-1",
                          "bg-muted/60 text-sm tabular-nums",
                          "transition-colors duration-150",
                          "hover:bg-muted",
                          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                        )} />}><span className="text-muted-foreground">+{count} more</span></PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-80 p-1"
        >
          {popoverContent}
        </PopoverContent>
      </Popover>
    );
  }

  // Default variant
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button" onClick={() => setOpen((prev) => !prev)} className={cn(
                      "flex items-center justify-center rounded-xl px-4 py-3",
                      "border-border bg-card border border-dashed",
                      "transition-colors duration-150",
                      "hover:border-foreground/25 hover:bg-muted/50",
                      "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    )} />}><span className="text-muted-foreground text-sm tabular-nums">
                      +{count} more sources
                    </span></PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-80 p-1"
      >
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
}

interface OverflowItemProps {
  citation: SerializableCitation;
  onClick: () => void;
}

function OverflowItem({ citation, onClick }: OverflowItemProps) {
  const color = siteColor(citation.domain, citation.title);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-[#F7F7F7] focus-visible:bg-[#F7F7F7] focus-visible:outline-none"
    >
      <SiteBadge citation={citation} size="md" />
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-bold transition-colors group-hover:underline group-hover:underline-offset-2"
          style={{ color }}
        >
          {citation.title}
        </p>
        <p className="truncate text-xs font-semibold text-[#AFAFAF] group-hover:text-[#4B4B4B]">
          {citation.domain}
        </p>
      </div>
      <ExternalLink
        className="mt-0.5 size-3.5 shrink-0 self-start opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color }}
      />
    </button>
  );
}

interface StackedCitationsProps {
  id: string;
  citations: SerializableCitation[];
  className?: string;
  size?: "default" | "compact";
  onNavigate?: (href: string, citation: SerializableCitation) => void;
}

function StackedCitations({
  id,
  citations,
  className,
  size = "default",
  onNavigate,
}: StackedCitationsProps) {
  const [open, setOpen] = React.useState(false);
  const maxIcons = 4;
  const visibleCitations = citations.slice(0, maxIcons);
  const remainingCount = Math.max(0, citations.length - maxIcons);
  const accentColor = siteColor(
    citations[0]?.domain,
    citations[0]?.title,
  );

  const handleClick = (citation: SerializableCitation) => {
    const href = resolveSafeNavigationHref(citation.href);
    if (!href) return;
    if (onNavigate) {
      onNavigate(href, citation);
    } else {
      openSafeNavigationHref(href);
    }
  };

  const compact = size === "compact";
  const iconSize = compact ? "size-5" : "size-7";
  const innerIcon = compact ? "size-4 text-[9px]" : "size-6 text-[11px]";
  const badgeImg = compact ? "size-4" : "size-5.5";

  return (
    <div className="inline-flex">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<button type="button" data-tool-ui-id={id} data-slot="citation-list" style={{ "--accent": accentColor } as React.CSSProperties} onClick={() => setOpen((prev) => !prev)} className={cn(
                            "group isolate inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white outline-none",
                            compact ? "px-2 py-1" : "gap-2 rounded-xl border-2 border-b-4 border-[#E5E5E5] px-3 py-2",
                            "transition-all hover:bg-slate-50",
                            !compact && "active:translate-y-[2px] active:border-b-2",
                            "focus-visible:ring-2 focus-visible:ring-slate-300",
                            open && "border-slate-300 bg-slate-50",
                            className,
                          )} />}><div className="flex items-center">
                            {visibleCitations.map((citation, index) => {
                              const color = siteColor(
                                citation.domain,
                                citation.title,
                              );
                              return (
                                <div
                                  key={citation.id}
                                  className={cn(
                                    "relative flex items-center justify-center rounded-full border border-white bg-white shadow-sm",
                                    iconSize,
                                    index > 0 && (compact ? "-ml-1.5" : "-ml-2.5"),
                                  )}
                                  style={{ zIndex: maxIcons - index }}
                                >
                                  {citation.favicon ? (
                                    <img
                                      src={citation.favicon}
                                      alt=""
                                      aria-hidden="true"
                                      width={compact ? 16 : 22}
                                      height={compact ? 16 : 22}
                                      className={cn("rounded-full object-cover", badgeImg)}
                                    />
                                  ) : (
                                    <span
                                      className={cn(
                                        "flex items-center justify-center rounded-full font-bold text-white",
                                        innerIcon,
                                      )}
                                      style={{ backgroundColor: color }}
                                    >
                                      {siteLabel(citation.domain, citation.title)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {remainingCount > 0 && (
                              <div
                                className={cn(
                                  "relative flex items-center justify-center rounded-full border border-white bg-slate-200",
                                  iconSize,
                                  compact ? "-ml-1.5" : "-ml-2.5",
                                )}
                                style={{ zIndex: 0 }}
                              >
                                <span className="text-[8px] font-bold text-slate-600">
                                  +{remainingCount}
                                </span>
                              </div>
                            )}
                          </div><span className={cn(
                            "font-bold tabular-nums text-slate-400 transition-colors group-hover:text-slate-600",
                            compact ? "text-[10px]" : "text-sm font-extrabold",
                          )}>
                            {citations.length}
                          </span></PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          className="w-80 p-1"
        >
          <div className="flex max-h-72 flex-col overflow-y-auto">
            {citations.map((citation) => (
              <OverflowItem
                key={citation.id}
                citation={citation}
                onClick={() => handleClick(citation)}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
