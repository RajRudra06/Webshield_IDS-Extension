import { continuousChecker } from "./helperFunctions/finalApplier.js";
import { installation } from "./helperFunctions/onInstall.js";
import { startup } from "./helperFunctions/onStartup.js";

let settings = { enabled: true };      

installation()
startup()
continuousChecker()

// background.js - MINIMAL TEST
console.log("✅ Background script loaded!");

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extension installed!");
});

// try {
//     console.log("🔵 Starting WebShield IDS...");
    
//     const { continuousChecker } = await import("./helperFunctions/finalApplier.js");
//     console.log("✅ Imported finalApplier");
    
//     const { installation } = await import("./helperFunctions/onInstall.js");
//     console.log("✅ Imported onInstall");
    
//     const { startup } = await import("./helperFunctions/onStartup.js");
//     console.log("✅ Imported onStartup");
  
//     let settings = { enabled: true };      
  
//     console.log("🔵 Running installation...");
//     await installation();
//     console.log("✅ Installation complete");
    
//     console.log("🔵 Running startup...");
//     await startup();
//     console.log("✅ Startup complete");
    
//     console.log("🔵 Starting continuous checker...");
//     await continuousChecker();
//     console.log("✅ Continuous checker active");
    
//     console.log("🟢 WebShield IDS loaded successfully!");
//   } catch (error) {
//     console.error("🔴 FATAL ERROR - WebShield IDS failed to load:");
//     console.error("Error message:", error.message);
//     console.error("Stack trace:", error.stack);
//     console.error("Full error object:", error);
//   }