import { initResources } from "./initResources.js";
import { loadStats } from "./state.js";

export async function startup() {
  chrome.runtime.onStartup.addListener(async () => {
    console.log("🔄 WebShield restarting...");
    await initResources()
    await loadStats()
  });
}
