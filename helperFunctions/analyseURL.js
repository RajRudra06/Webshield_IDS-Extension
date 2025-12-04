// approach #2 (weighted average is taken)
// import { checkLocalDatabase } from "./checkLocalDB_1.js";
// import { checkHeuristics } from "./checkHeuristics_2.js";
// import { checkMLResult } from "../mlSystems/checkMLResults.js";
// import { checkGoogleSafeBrowsing } from "./checkGoogleSafe_3.js";
// import { checkVirusTotal } from "./checkVirusTotal_4.js";
// import { checkOpenPhish } from "./checkOpen_PhishTank_5.js";

// export async function analyzeURL(url) {
//     console.log(`🔍 Analyzing: ${url}`);
  
//     const results = {
//       url,
//       timestamp: Date.now(),
//       checks: {},
//       finalDecision: { blocked: false, score: 0, reasons: [], verdict: "SAFE" },
//     };
  
//     const dbResult = checkLocalDatabase(url);
//     if (dbResult.blocked) return finalize(dbResult);
  
//     const heuristicResult = checkHeuristics(url);
//     if (heuristicResult.blocked) return finalize(heuristicResult);
  
//     const mlResult = await checkMLResult(url); 
    
//     results.checks = {
//         database: dbResult,
//         heuristics: heuristicResult,
//         ml_heuristic: mlResult
//     };

//     // Run all external API checks in parallel
//     const checks = await Promise.allSettled([
//       checkGoogleSafeBrowsing(url),
//       checkOpenPhish(url),
//     ]);
    
//     results.checks.safebrowsing = get(checks[0]);
//     results.checks.openphish = get(checks[1]);
    
//     // Skip VirusTotal
//     console.log('⚠️ VirusTotal key unavailable, skipping it');
//     results.checks.virustotal = { blocked: false, score: 0 };
  
//     // Weight system - higher weight = more trusted
//     const weights = {
//       database: 1.0,
//       safebrowsing: 0.9,      // ✅ FIXED: matches key name
//       openphish: 0.9,         // ✅ FIXED: lowercase
//       virustotal: 0.8,
//       ml_heuristic: 0.7,
//       heuristics: 0.5,
//     };
  
//     // Calculate weighted score
//     const { totalScore, totalWeight, reasons } = Object.entries(results.checks).reduce(
//       (acc, [layer, r]) => {
//         const w = weights[layer] || 0;
//         acc.totalWeight += w;
//         acc.totalScore += (r?.score || 0) * w;
//         if (r?.blocked && r?.reason) acc.reasons.push(`${layer}: ${r.reason}`);
//         return acc;
//       },
//       { totalScore: 0, totalWeight: 0, reasons: [] }  // ✅ FIXED: correct variable names
//     );
  
//     const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;  // ✅ FIXED: use correct variables
  
//     results.finalDecision = {
//       blocked: finalScore > 0.6,
//       score: finalScore,
//       reasons,
//       verdict:
//         finalScore > 0.8
//           ? "HIGH THREAT"
//           : finalScore > 0.6
//           ? "MEDIUM THREAT"
//           : "SAFE",
//     };
  
//     console.log('🧠 Analysis result:', results);  // ✅ ADDED: Debug output
//     return results;
  
//     function get(entry) {
//       return entry.status === "fulfilled" ? entry.value : { blocked: false, score: 0 };
//     }
  
//     function finalize(result) {
//       return {
//         url,
//         timestamp: Date.now(),
//         checks: { [result.layer || "early_exit"]: result },
//         finalDecision: result,
//       };
//     }
//   }

// approach #1 (Cascade Flow)
import { checkLocalDatabase } from "./checkLocalDB_1.js";
import { checkHeuristics } from "./checkHeuristics_2.js";
import { checkMLResult } from "../mlSystems/checkMLResults.js";
import { checkGoogleSafeBrowsing } from "./checkGoogleSafe_3.js";
import { checkVirusTotal } from "./checkVirusTotal_4.js";
import { checkOpenPhish } from "./checkOpen_PhishTank_5.js";

export async function analyzeURL(url) {
    console.log(`🔍 Analyzing: ${url}`);
  
    const results = {
      url,
      timestamp: Date.now(),
      checks: {},
      finalDecision: { blocked: false, score: 0, reasons: [], verdict: "SAFE" },
    };
  
    // ========== PHASE 1: Local Quick Checks ==========
    console.log('📋 Phase 1: Checking local database...');
    const dbResult = checkLocalDatabase(url);
    if (dbResult.blocked) {
      console.log('🚨 BLOCKED by local database - Early exit');
      return finalize(dbResult);
    }
  
    console.log('🔍 Phase 1: Checking heuristics...');
    const heuristicResult = checkHeuristics(url);
    if (heuristicResult.blocked) {
      console.log('🚨 BLOCKED by heuristics - Early exit');
      return finalize(heuristicResult);
    }
  
    // ========== PHASE 2: External Trusted Sources (APIs) ==========
    console.log('🌐 Phase 2: Checking trusted external sources...');
    
    const checks = await Promise.allSettled([
      checkGoogleSafeBrowsing(url),
      checkOpenPhish(url),
    ]);
    
    const safebrowsing = get(checks[0]);
    const openphish = get(checks[1]);
    
    // Skip VirusTotal
    console.log('⚠️ VirusTotal key unavailable, skipping it');
    const virustotal = { blocked: false, score: 0 };
    
    // ✅ EARLY EXIT: If Google Safe Browsing found threat
    if (safebrowsing.blocked) {
      console.log('🚨 BLOCKED by Google Safe Browsing - Early exit');
      results.checks = {
        database: dbResult,
        heuristics: heuristicResult,
        safebrowsing: safebrowsing,
        openphish: openphish,
        virustotal: virustotal
      };
      results.finalDecision = {
        blocked: true,
        score: safebrowsing.score,
        reasons: [safebrowsing.reason],
        verdict: "HIGH THREAT"
      };
      console.log('🧠 Analysis result:', results);
      return results;
    }
    
    // ✅ EARLY EXIT: If OpenPhish found threat
    if (openphish.blocked) {
      console.log('🚨 BLOCKED by OpenPhish - Early exit');
      results.checks = {
        database: dbResult,
        heuristics: heuristicResult,
        safebrowsing: safebrowsing,
        openphish: openphish,
        virustotal: virustotal
      };
      results.finalDecision = {
        blocked: true,
        score: openphish.score,
        reasons: [openphish.reason],
        verdict: "HIGH THREAT"
      };
      console.log('🧠 Analysis result:', results);
      return results;
    }
    
    // ========== PHASE 3: ML Analysis (Only if trusted sources say "safe") ==========
    console.log('🧠 Phase 3: Trusted sources found nothing, checking ML model...');
    const mlResult = await checkMLResult(url);
    
    results.checks = {
        database: dbResult,
        heuristics: heuristicResult,
        safebrowsing: safebrowsing,
        openphish: openphish,
        virustotal: virustotal,
        ml_heuristic: mlResult
    };
    
    // ✅ If ML says it's malicious (blocked or high score)
    if (mlResult.blocked) {
      console.log('🚨 BLOCKED by ML model - Suspicious patterns detected');
      results.finalDecision = {
        blocked: true,
        score: mlResult.score,
        reasons: [mlResult.reason || 'ML Model: Detected as malicious'],
        verdict: mlResult.score > 0.8 ? "HIGH THREAT" : "MEDIUM THREAT"
      };
      console.log('🧠 Analysis result:', results);
      return results;
    }
    
    // ========== PHASE 4: All Checks Passed - URL is Safe ==========
    console.log('✅ All checks passed - URL appears safe');
    results.finalDecision = {
      blocked: false,
      score: mlResult.score || 0,
      reasons: [],
      verdict: "SAFE"
    };
  
    console.log('🧠 Analysis result:', results);
    return results;
  
    function get(entry) {
      return entry.status === "fulfilled" ? entry.value : { blocked: false, score: 0 };
    }
  
    function finalize(result) {
      console.log('🧠 Analysis result (early exit):', {
        url,
        timestamp: Date.now(),
        checks: { [result.layer || "early_exit"]: result },
        finalDecision: result,
      });
      return {
        url,
        timestamp: Date.now(),
        checks: { [result.layer || "early_exit"]: result },
        finalDecision: result,
      };
    }
}