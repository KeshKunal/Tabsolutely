/**
 * app.js is the popup's entry point. It coordinates startup while UI-specific
 * DOM updates live in ui.js, keeping responsibilities easy to understand.
 */

import { showReadyState } from "./ui.js";

function initializePopup() {
  showReadyState();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePopup, { once: true });
} else {
  initializePopup();
}
