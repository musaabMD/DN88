"use client";

import { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useRouter } from "next/navigation";
import { articlePath } from "@/lib/routes";
import { getPageById } from "@/lib/pages";
import { syncWikiLinksInEditor } from "@/components/library/editor/wiki-link/wiki-link-commands";
import { CreatePageDialog } from "@/components/library/editor/wiki-link/create-page-dialog";

type WikiLinkEditorOverlayProps = {
  editor: Editor;
};

type PendingCreate = {
  pageId: string;
  pageTitle: string;
};

/** Handles internal wiki-link clicks and the create-page flow. */
export function WikiLinkEditorOverlay({ editor }: WikiLinkEditorOverlayProps) {
  const router = useRouter();
  const [pendingCreate, setPendingCreate] = useState<PendingCreate | null>(null);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const anchor = target.closest("a[data-link-type='internal']");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;

      event.preventDefault();
      event.stopPropagation();

      const pageId = anchor.getAttribute("data-page-id") ?? "";
      const pageTitle = anchor.getAttribute("data-page-title") ?? "";
      const exists = anchor.getAttribute("data-exists") !== "false";

      if (exists) {
        const page = getPageById(pageId);
        router.push(page ? articlePath(page.slug) : anchor.getAttribute("href") ?? "#");
        return;
      }

      setPendingCreate({ pageId, pageTitle });
    },
    [router]
  );

  useEffect(() => {
    const dom = editor.view.dom;
    dom.addEventListener("click", handleClick);
    return () => dom.removeEventListener("click", handleClick);
  }, [editor, handleClick]);

  return (
    <CreatePageDialog
      open={pendingCreate !== null}
      title={pendingCreate?.pageTitle ?? ""}
      onClose={() => setPendingCreate(null)}
      onCreated={(page) => {
        syncWikiLinksInEditor(editor);
        router.push(articlePath(page.slug));
        setPendingCreate(null);
      }}
    />
  );
}
