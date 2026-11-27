import { useEffect } from "react";

/** Tab title "<title> - OpenPrime" while the calling page is mounted (WCAG 2.4.2). */
export function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    document.title = `${title} - OpenPrime`;
    return () => {
      document.title = "OpenPrime";
    };
  }, [title]);
}
