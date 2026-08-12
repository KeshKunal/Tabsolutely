/**
 * ui.js owns changes to visible popup elements. Exported functions allow app.js
 * to request a UI update without needing to know the update's DOM details.
 */

export function showReadyState() {
  const title = document.getElementById("status-title");
  const message = document.getElementById("status-message");
  if (!title || !message) {
    console.error("Tabsolutely: status elements were not found")
    return;
  }

  title.textContent = "Tabsolutely";
  message.textContent = "Ready to find your tabs a match! 💖";

  title.classList.add("ready");
  message.classList.add("ready-message");
}
