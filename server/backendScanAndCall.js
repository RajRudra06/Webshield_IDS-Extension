import { stats,updateStats } from "../helperFunctions/state.js";

export async function runBackendScan(tabId, url) {
    try {
        const backendResult = await fetch("https://your-fastapi/ensemble", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        }).then(r => r.json());

        // When backend replies, handle the result
        handleBackendDecision(tabId, url, backendResult);

    } catch (err) {
        console.error("❌ Backend scan failed:", err);
    }
}

export async function handleBackendDecision(tabId, originalUrl, backendResult) {

    // CASE C — Tab closed
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab) {
        console.log("Tab closed. Ignoring backend result.");
        return;
    }

    const currentUrl = tab.url;

    // If backend says SAFE → nothing more to do
    if (!backendResult.blocked) {
        console.log("Backend says safe:", originalUrl);
        return;
    }

    const sameDomain = isSameDomain(currentUrl, originalUrl);

    // CASE B — User left the domain but tab is still open
    if (!sameDomain) {
        console.log("User navigated away. Showing notification only.");

        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/warning.png",
            title: "Previous Page Found Malicious",
            message: `The page you previously visited was unsafe:\n${originalUrl}\nReason: ${backendResult.reason}`
        });

        return; // Do NOT redirect
    }

    // CASE A — User still on the same domain → redirect to block page
    console.log("User still on malicious domain. Redirecting.");

    const blockedPageUrl = chrome.runtime.getURL("pages/blocked.html") +
        `?url=${encodeURIComponent(originalUrl)}` +
        `&reason=${encodeURIComponent(backendResult.reason)}`;

    chrome.tabs.update(tabId, { url: blockedPageUrl });
}

function getDomain(u) {
    try {
        const url = new URL(u);
        const parts = url.hostname.split(".");
        if (parts.length <= 2) return url.hostname;
        return parts.slice(-2).join("."); // example: login.google.com → google.com
    } catch {
        return u;
    }
}

function isSameDomain(a, b) {
    return getDomain(a) === getDomain(b);
}
