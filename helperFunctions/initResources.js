// initResources.js
import { loadThreatDatabase } from "../pre_database/loadDatabase.js";
import { loadMLModel } from "../mlSystems/loadAndPredict.js";

export async function initResources() {
  await loadThreatDatabase();
  await loadMLModel();
}
