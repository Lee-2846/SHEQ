import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * FIX 8: Global Route-Change Scroll to Top
 * Resets window scroll position to (0, 0) whenever route path changes.
 * Does not interfere with inner modal scrolling or map interactions.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }, [pathname]);

  return null;
}
