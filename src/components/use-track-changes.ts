"use client";

import * as React from "react";

/**
 * Lightweight "track changes" for a contentEditable document. While enabled,
 * any text a reviewer types (or pastes) is wrapped in a yellow span tagged with
 * the author's name, so edits are visible and attributed. Contiguous typing is
 * collected into a single span (one name label per edit run).
 */
export function useTrackChanges(
  ref: React.RefObject<HTMLElement>,
  author: string,
  enabled: boolean,
) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || !author) return;

    function makeSpan(text: string): HTMLSpanElement {
      const span = document.createElement("span");
      span.className = "ct-edit";
      span.setAttribute("data-author", author);
      span.setAttribute("title", `Edited by ${author}`);
      span.textContent = text;
      return span;
    }

    function caretInsideOwnEdit(range: Range): boolean {
      const node =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : (range.startContainer as Element);
      const span = node?.closest?.("span.ct-edit") as HTMLElement | null;
      return !!span && span.getAttribute("data-author") === author;
    }

    function onBeforeInput(e: Event) {
      const ie = e as InputEvent;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);

      if (ie.inputType === "insertText" && ie.data != null) {
        // Continue typing inside the current author's edit run.
        if (range.collapsed && caretInsideOwnEdit(range)) return;
        ie.preventDefault();
        const span = makeSpan(ie.data);
        range.deleteContents();
        range.insertNode(span);
        // Place the caret INSIDE the span so the next character joins it.
        const after = document.createRange();
        after.selectNodeContents(span);
        after.collapse(false);
        sel.removeAllRanges();
        sel.addRange(after);
      } else if (ie.inputType === "insertFromPaste") {
        const text = ie.dataTransfer?.getData("text/plain");
        if (!text) return;
        ie.preventDefault();
        const span = makeSpan(text);
        range.deleteContents();
        range.insertNode(span);
        const after = document.createRange();
        after.setStartAfter(span);
        after.collapse(true);
        sel.removeAllRanges();
        sel.addRange(after);
      }
    }

    el.addEventListener("beforeinput", onBeforeInput);
    return () => el.removeEventListener("beforeinput", onBeforeInput);
  }, [ref, author, enabled]);
}
