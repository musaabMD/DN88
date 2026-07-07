interface ProgressBarProps {
  progress: number;
  size?: "sm" | "md";
}

export default function ProgressBar({ progress, size = "md" }: ProgressBarProps) {
  const height = size === "sm" ? "h-2" : "h-3";

  return (
    <div className={`w-full overflow-hidden rounded-full bg-primary-light ${height}`}>
      <div
        className={`${height} rounded-full bg-primary transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
