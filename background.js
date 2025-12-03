// import { continuousChecker } from "./helperFunctions/finalApplier.js";
// import { installation } from "./helperFunctions/onInstall.js";
// import { startup } from "./helperFunctions/onStartup.js";
// import { initResources } from "./helperFunctions/initResources.js";

// let settings = { enabled: true };      

// installation()
// startup()

// await initResources()

// continuousChecker()

// console.log("✅ Background script loaded");

// chrome.runtime.onInstalled.addListener(() => {
//   console.log("✅ Extension installed!");
// });

import { continuousChecker } from "./helperFunctions/finalApplier.js";
import { installation } from "./helperFunctions/onInstall.js";
import { startup } from "./helperFunctions/onStartup.js";
import { initResources } from "./helperFunctions/initResources.js";

let settings = { enabled: true };

// Wrap everything in an async IIFE (Immediately Invoked Function Expression)
(async () => {
  try {
    installation();
    startup();
    
    await initResources();
    
    continuousChecker();
    
    console.log("✅ Background script loaded");
  } catch (error) {
    console.error("❌ Background script initialization failed:", error);
  }
})();

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extension installed!");
});