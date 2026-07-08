import DrNoteApp from "@/components/DrNoteApp";
import { DEFAULT_TAB } from "@/lib/routes";

export default function HomePage() {
  return <DrNoteApp tab={DEFAULT_TAB} />;
}
