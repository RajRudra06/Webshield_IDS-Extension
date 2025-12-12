import { analyzeURL } from "./analyseURL.js";
import { updateStats, stats } from "./state.js";
import { runBackendScan } from "../server/backendScanAndCall.js";

// Helper function to extract domain
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export async function continuousChecker() {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

    if (changeInfo.status === 'loading' && changeInfo.url) {
      const url = changeInfo.url;

      // Skip Chrome internal URLs and about:blank
      if (
        url.startsWith("chrome://") ||
        url.startsWith("chrome-extension://") ||
        url.startsWith("about:")
      ) {
        return;
      }

      // Skip Google search pages
      if (url.startsWith("https://www.google.com/search")) {
        console.log("Skipping Google search page:", url);
        return;
      }

      const { settings } = await chrome.storage.local.get("settings");
      if (!settings?.enabled) return;

      // ✅ CHECK DOMAIN WHITELIST - Skip if user chose to proceed anyway
      const domain = extractDomain(url);
      const { domainWhitelist = [] } = await chrome.storage.session.get('domainWhitelist');
      if (domainWhitelist.includes(domain)) {
        console.log("⚪ Domain is whitelisted (session). Skipping scan:", domain);
        return;
      }

      // ✅ CHECK IF ALREADY SCANNED THIS URL (Option 2: Full URL tracking)
      const { scannedURLs = [] } = await chrome.storage.session.get('scannedURLs');
      if (scannedURLs.includes(url)) {
        console.log("✅ URL already scanned this session. Skipping:", url);
        return;
      }

      // Mark URL as scanned
      scannedURLs.push(url);
      await chrome.storage.session.set({ scannedURLs });
      console.log(`📝 Added to scanned list (${scannedURLs.length} total URLs):`, url);

      analyzeAndRedirectIfNeeded(tabId, url);
    }
  });
}

async function analyzeAndRedirectIfNeeded(tabId, url) {
  try {
    // Update stats (only for NEW scans)
    stats.scanned++;
    updateStats();
    
    console.log(`📊 Scanning URL #${stats.scanned}:`, url);
    
    // Run full multi-layer analysis
    const result = await analyzeURL(url);
    console.log("🧠 Analysis result:", result);
    
    // Save last scan
    await chrome.storage.local.set({ lastScan: result });

    // If threat detected
    if (result.finalDecision.blocked) {
      stats.blocked++;
      updateStats();
      
      console.log("🚨 THREAT DETECTED!");
      
      // Set badge to RED with "!"
      chrome.action.setBadgeText({ 
        tabId: tabId,
        text: "!" 
      });
      
      chrome.action.setBadgeBackgroundColor({ 
        tabId: tabId,
        color: "#FF0000" 
      });
      
      chrome.action.setTitle({
        tabId: tabId,
        title: `🚨 Threat Blocked!\n${url}\nReason: ${result.finalDecision.reasons.join(", ")}`
      });
      
      // Store blocked info
      await chrome.storage.local.set({
        currentThreat: {
          url: url,
          reasons: result.finalDecision.reasons,
          timestamp: Date.now(),
          tabId: tabId
        }
      });
      
      // BLOCK THE PAGE - redirect to blocked page
      const blockedUrl = chrome.runtime.getURL("pages/blocked.html");
      chrome.tabs.update(tabId, { url: blockedUrl });
      
      // Try to auto-open the extension popup
      try {
        chrome.action.openPopup();
      } catch (e) {
        console.log("Could not auto-open popup (user interaction needed)");
      }
    }

    // If ML was uncertain → backend scan must run in background
    if (result.finalDecision.verdict === "REVIEW_ASYNC") {
      console.log("⏳ ML uncertain → launching backend scan in background");
      runBackendScan(tabId, url); 
    }

  } catch (error) {
    console.error("❌ Analysis failed:", error);
  }
}