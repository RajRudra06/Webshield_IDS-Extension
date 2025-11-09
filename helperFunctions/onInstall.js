import { loadMLModel } from "../mlSystems/loadAndPredict.js";
import { loadThreatDatabase } from "../pre_database/loadDatabase.js";

export async function installation() {
  chrome.runtime.onInstalled.addListener(async (details) => {
    console.log("🛡️ WebShield IDS installing...");

    // Initialize defaults
    await chrome.storage.local.set({
      stats: { blocked: 0, scanned: 0, installed: Date.now() },
      settings: { enabled: true, blockMode: "warn" },
      whitelist: [],
      apiKeys: {
        googleSafeBrowsing: "", // Users can add their keys later
        virusTotal: "",
        phishTank: ""
      }
    });

    // Load resources
    await loadThreatDatabase();
    await loadMLModel();

    console.log("✅ WebShield IDS ready!");

    // Notify user on install
    if (details.reason === "install") {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "WebShield IDS Installed",
        message: "You are now protected against web threats!"
      });
    }
  });
}
