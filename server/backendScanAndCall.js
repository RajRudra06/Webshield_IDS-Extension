
import { stats, updateStats } from "../helperFunctions/state.js";

export async function runBackendScan(tabId, url) {
    try {
        const backendResult = await fetch("http://127.0.0.1:8000/inference/", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        }).then(r => r.json());

        handleBackendDecision(tabId, url, backendResult);

    } catch (err) {
        console.error("❌ Backend scan failed:", err);
    }
}

// Helper function to extract domain
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export async function handleBackendDecision(tabId, originalUrl, backendResult) {

    // Tab closed
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab) {
        console.log("Tab closed. Ignoring backend result.");
        return;
    }

    const currentUrl = tab.url;

    // Extract backend result fields
    const threatDetected = backendResult?.final_decision?.threat_detected === true;
    const prediction = backendResult?.final_decision?.prediction || "unknown";
    const confidence = backendResult?.final_decision?.confidence || 0;

    // SAFE → no action
    if (!threatDetected) {
        console.log("✅ Backend says safe:", originalUrl);
        return;
    }

    // ✅ CHECK DOMAIN WHITELIST - Skip if user chose to proceed anyway
    const domain = extractDomain(originalUrl);
    const { domainWhitelist = [] } = await chrome.storage.session.get('domainWhitelist');
    if (domainWhitelist.includes(domain)) {
      console.log("⚪ Domain is whitelisted (session). Skipping backend block:", domain);
      return;
    }

    console.log("🚨 Backend detected threat:", originalUrl);

    const sameDomain = isSameDomain(currentUrl, originalUrl);

    // Update stats
    stats.blocked++;
    updateStats();

    // Prepare threat reasons
    const reasons = [
        `Backend ML Detection: ${prediction}`,
        `Confidence: ${(confidence * 100).toFixed(1)}%`,
        "Detected after async deep analysis"
    ];

    // Set badge to RED with "!"
    chrome.action.setBadgeText({ 
      tabId: tabId,
      text: "!" 
    });
    
    chrome.action.setBadgeBackgroundColor({ 
      tabId: tabId,
      color: "#FF0000" 
    });
    
    // Set tooltip
    chrome.action.setTitle({
      tabId: tabId,
      title: `🚨 Threat Detected by Backend!\n${originalUrl}\nPrediction: ${prediction}`
    });

    // Store threat info for popup
    await chrome.storage.local.set({
      currentThreat: {
        url: originalUrl,
        reasons: reasons,
        timestamp: Date.now(),
        tabId: tabId,
        source: "backend"
      }
    });

    // If user moved to another site → notify only
    if (!sameDomain) {
        console.log("⚠️ User navigated away. Badge + popup notification only.");

        // Try to auto-open popup
        try {
          chrome.action.openPopup();
        } catch (e) {
          console.log("Could not auto-open popup (user interaction needed)");
        }

        return;
    }

    // User still on same malicious domain → BLOCK IT
    console.log("🚫 User still on malicious domain. Redirecting to blocked page.");

    const blockedUrl = chrome.runtime.getURL("pages/blocked.html");
    chrome.tabs.update(tabId, { url: blockedUrl });

    // Try to auto-open popup
    try {
      chrome.action.openPopup();
    } catch (e) {
      console.log("Could not auto-open popup (user interaction needed)");
    }
}

function getDomain(u) {
    try {
        const url = new URL(u);
        const parts = url.hostname.split(".");
        if (parts.length <= 2) return url.hostname;
        return parts.slice(-2).join(".");
    } catch {
        return u;
    }
}

function isSameDomain(a, b) {
    return getDomain(a) === getDomain(b);
}