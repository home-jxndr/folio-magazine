// Cookie consent component
import { useEffect } from "react";

export function CookieConsent() {
  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const shown = new Date().getTime();
      localStorage.setItem("cookie-consent-time", shown.toString());
      // Show consent banner - will be styled by CSS
      const style = document.createElement("style");
      style.textContent = `
        .cookie-consent-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--paper);
          color: var(--ink);
          padding: 1rem;
          border-top: 2px solid var(--rule);
          z-index: 100;
          text-align: center;
        }
        .cookie-consent-banner accept {
          background: var(--accent);
          color: var(--paper);
          border: none;
          padding: 0.5rem 1rem;
          margin-left: 1rem;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  return null; // Consent handled locally
}
