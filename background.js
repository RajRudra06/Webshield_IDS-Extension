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
    
    // 📊 Storage Debugging - Check usage and data
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 STORAGE DEBUG INFO");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Check how much storage you're using
    chrome.storage.local.getBytesInUse(null, (bytes) => {
      console.log(`📊 Local Storage: ${(bytes/1024).toFixed(2)} KB / 10,240 KB (${((bytes/1024)/10240*100).toFixed(2)}% used)`);
    });
    
    // View everything stored
    chrome.storage.local.get(null, (data) => {
      console.log("📦 All Local Data:", data);
    });
    
    chrome.storage.session.get(null, (data) => {
      console.log("📦 All Session Data:", data);
    });
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
  } catch (error) {
    console.error("❌ Background script initialization failed:", error);
  }
})();

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extension installed!");
});

// 🧹 UTILITY: Clear storage (uncomment to use during development)
// Uncomment these lines to clear storage when extension reloads
/*
chrome.storage.local.clear(() => {
  console.log("🧹 Local storage cleared");
});

chrome.storage.session.clear(() => {
  console.log("🧹 Session storage cleared");
});
*/