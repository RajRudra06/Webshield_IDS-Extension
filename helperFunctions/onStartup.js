import { loadThreatDatabase } from "./loadThreatDatabase.js";
import { loadMLModel } from "./loadMLModel.js";
import { loadStats } from "./state.js";

export async function startup() {
  chrome.runtime.onStartup.addListener(async () => {
    console.log("🔄 WebShield restarting...");
    await loadThreatDatabase();
    await loadMLModel();
    await loadStats()

  });
}
