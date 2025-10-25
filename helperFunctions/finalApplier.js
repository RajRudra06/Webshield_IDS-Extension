import { analyzeURL } from "./analyseURL";
import { updateStats,stats } from "./state";

export async function continuousChecker(){
    chrome.webRequest.onBeforeRequest.addListener(
        async function (details) {
          // Only analyze main page loads
          if (details.type !== "main_frame") return { cancel: false };
      
          const url = details.url;
      
          // Skip Chrome internal URLs
          if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
            return { cancel: false };
          }
      
          // Check user settings
          const { settings } = await chrome.storage.local.get("settings");
          if (!settings?.enabled) return { cancel: false };
      
          // Update scan stats
          stats.scanned++;
          updateStats();
      
          // Run full multi-layer analysis
          const result = await analyzeURL(url);
          console.log("🧠 Analysis result:", result);
      
          // Optional: save last scan results
          await chrome.storage.local.set({ lastScan: result });
      
          // If blocked, cancel request
          if (result.finalDecision.blocked) {
            stats.blocked++;
            updateStats();
      
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icons/icon128.png",
              title: "⚠️ Threat Blocked by WebShield IDS",
              message: `URL: ${url}\nReason: ${result.finalDecision.reasons.join(", ")}`,
            });
      
            return { cancel: true };
          }
      
          // Otherwise, allow navigation
          return { cancel: false };
        },
        { urls: ["<all_urls>"] },
        ["blocking"]
      );
      
}

