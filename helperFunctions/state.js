export let stats = {
    blocked: 0,
    scanned: 0,
    lastUpdate: Date.now()
  };
  
  export async function updateStats() {
    stats.lastUpdate = Date.now();
    await chrome.storage.local.set({ stats });
  }

  export let settings = {
    enabled: true,
    blockMode: "warn"
  };
  
  export async function loadStats() {
    const data = await chrome.storage.local.get(["stats", "settings"]);
    if (data.stats) stats = data.stats;
    if (data.settings) settings = data.settings;
  }
  