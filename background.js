import { continuousChecker } from "./helperFunctions/finalApplier.js";
import { installation } from "./helperFunctions/onInstall.js";
// import { startup } from "./helperFunctions/onStartup.js";

let settings = { enabled: true };      

// installation()
// startup()
continuousChecker()

console.log("✅ Background script loaded");

// chrome.runtime.onInstalled.addListener(() => {
//   console.log("✅ Extension installed!");
// });
