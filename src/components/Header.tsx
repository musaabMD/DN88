import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-extrabold text-white shadow-md shadow-primary/30">
            D
          </div>
          <span className="text-lg font-extrabold text-foreground">DrNote</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/add"
            className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </Link>
          <button className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4" />
            Upgrade
          </button>
        </div>
      </div>
    </header>
  );
}
