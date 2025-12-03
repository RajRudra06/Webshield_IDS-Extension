import { checkLocalDatabase } from "./checkLocalDB_1.js";
import { checkHeuristics } from "./checkHeuristics_2.js";
import { checkMLResult } from "../mlSystems/checkMLResults.js";
import { checkGoogleSafeBrowsing } from "./checkGoogleSafe_3.js";
import { checkVirusTotal } from "./checkVirusTotal_4.js";
import { checkPhishTank } from "./checkPhishTank_5.js";

export async function analyzeURL(url) {
    console.log(`🔍 Analyzing: ${url}`);
  
    const results = {
      url,
      timestamp: Date.now(),
      checks: {},
      finalDecision: { blocked: false, score: 0, reasons: [], verdict: "SAFE" },
    };
  
    const dbResult = checkLocalDatabase(url);
    if (dbResult.blocked) return finalize(dbResult);
  
    const heuristicResult = checkHeuristics(url);
    if (heuristicResult.blocked) return finalize(heuristicResult);
  
    const mlResult = await checkMLResult(url); 
    
    results.checks = {
        database: dbResult,
        heuristics: heuristicResult,
        ml_heuristic: mlResult
    };

    const checks = await Promise.allSettled([
      checkGoogleSafeBrowsing(url),
      checkVirusTotal(url),
      checkPhishTank(url),
    ]);
  
    results.checks.safebrowsing = get(checks[0]);
    results.checks.virustotal = get(checks[1]);
    results.checks.phishtank = get(checks[2]);
  
    const weights = {
      database: 1.0,
      google_safebrowsing: 0.9,
      phishtank: 0.9,
      virustotal: 0.8,
      ml_heuristic: 0.7,
      heuristics: 0.5,
    };
  
    const { weightedScore, reasons } = Object.entries(results.checks).reduce(
      (acc, [layer, r]) => {
        const w = weights[layer] || 0;
        acc.totalWeight += w;
        acc.totalScore += (r?.score || 0) * w;
        if (r?.blocked && r?.reason) acc.reasons.push(`${layer}: ${r.reason}`);
        return acc;
      },
      { totalScore: 0, totalWeight: 0, reasons: [] }
    );
  
    const finalScore = weightedScore / (results.totalWeight || 1);
  
    results.finalDecision = {
      blocked: finalScore > 0.6,
      score: finalScore,
      reasons,
      verdict:
        finalScore > 0.8
          ? "HIGH THREAT"
          : finalScore > 0.6
          ? "MEDIUM THREAT"
          : "SAFE",
    };
  
    return results;
  
    function get(entry) {
      return entry.status === "fulfilled" ? entry.value : { blocked: false, score: 0 };
    }
  
    function finalize(result) {
      return {
        url,
        timestamp: Date.now(),
        checks: { [result.layer || "early_exit"]: result },
        finalDecision: result,
      };
    }
  }
  