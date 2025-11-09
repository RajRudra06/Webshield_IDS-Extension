import { loadThreatDatabase } from "../pre_database/loadDatabase";
import { loadMLModel } from "../mlSystems/loadAndPredict.js";
import { loadStats } from "./state.js";

export async function startup() {
  chrome.runtime.onStartup.addListener(async () => {
    console.log("🔄 WebShield restarting...");
    await loadThreatDatabase();
    await loadMLModel();
    await loadStats()

  });
}
