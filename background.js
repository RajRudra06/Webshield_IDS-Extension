import { continuousChecker } from "./helperFunctions/finalApplier.js";
import { installation } from "./helperFunctions/onInstall.js";
import { startup } from "./helperFunctions/onStartup.js";
import { initResources } from "./helperFunctions/initResources.js";

let settings = { enabled: true };      

installation()
startup()

await initResources()

continuousChecker()

console.log("✅ Background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extension installed!");
});
