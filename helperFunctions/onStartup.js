import { loadThreatDatabase } from "./loadThreatDatabase.js";
import { loadMLModel } from "./loadMLModel.js";

export async function startup() {
  chrome.runtime.onStartup.addListener(async () => {
    console.log("🔄 WebShield restarting...");
    await loadThreatDatabase();
    await loadMLModel();

    const data = await chrome.storage.local.get(["stats", "settings"]);
    stats = data.stats || { blocked: 0, scanned: 0 };
    settings = data.settings || { enabled: true, blockMode: "warn" };
  });
}
