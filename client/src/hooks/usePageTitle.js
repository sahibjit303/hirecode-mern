import { useEffect } from "react";

/**
 * Sets the document title on mount and restores the default on unmount.
 * @param {string} title - Page-specific title
 */
export default function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | CodeHire` : "CodeHire | Hire Engineers, Not Vibecoders";
    return () => {
      document.title = prev;
    };
  }, [title]);
}
