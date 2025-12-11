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

    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab) return;

    const currentUrl = tab.url;

    // If user left the page → do nothing or notify
    if (currentUrl !== originalUrl) {
        console.log("User navigated away. Dropping backend result.");
        return;
    }

    // User is still on the malicious page
    if (backendResult.blocked) {

        // Option A: notify only
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/warning.png",
            title: "Backend AI detected a threat",
            message: `${originalUrl}\n${backendResult.reason}`
        });

        // Option B: redirect AFTER page loaded
        /*
        const blockedPageUrl = chrome.runtime.getURL("pages/blocked.html") +
                `?url=${encodeURIComponent(originalUrl)}` +
                `&reason=${encodeURIComponent(backendResult.reason)}`;
        chrome.tabs.update(tabId, { url: blockedPageUrl });
        */
    }
}
