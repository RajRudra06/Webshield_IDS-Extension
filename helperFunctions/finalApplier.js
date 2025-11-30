import { analyzeURL } from "./analyseURL.js";
import { updateStats,stats } from "./state.js";

export async function continuousChecker() {
  // Listen for tab navigation (non-blocking)
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    
    // Only check when URL changes and starts loading
    if (changeInfo.status === 'loading' && changeInfo.url) {
      const url = changeInfo.url;
      
      // Skip Chrome internal URLs
      if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
        return;
      }
      
      // Check user settings
      const { settings } = await chrome.storage.local.get("settings");
      if (!settings?.enabled) return;
      
      // Run analysis in background (async - doesn't block page load)
      analyzeAndRedirectIfNeeded(tabId, url);
    }
  });
}

async function analyzeAndRedirectIfNeeded(tabId, url) {
  try {
    // Update stats
    stats.scanned++;
    updateStats();
    
    // Run full multi-layer analysis
    const result = await analyzeURL(url);
    console.log("🧠 Analysis result:", result);
    
    // Save last scan
    await chrome.storage.local.set({ lastScan: result });
    
    // If threat detected, redirect immediately
    if (result.finalDecision.blocked) {
      stats.blocked++;
      updateStats();
      
      // Redirect to blocked page
      const blockedPageUrl = chrome.runtime.getURL("pages/blocked.html") + 
                             `?url=${encodeURIComponent(url)}` +
                             `&reason=${encodeURIComponent(result.finalDecision.reasons.join(", "))}`;
      
      chrome.tabs.update(tabId, { url: blockedPageUrl });
      
      // Show notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "⚠️ Threat Blocked by WebShield IDS",
        message: `URL: ${url}\nReason: ${result.finalDecision.reasons.join(", ")}`,
      });
    }
  } catch (error) {
    console.error("❌ Analysis failed:", error);
  }
}