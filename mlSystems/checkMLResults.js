import { predictUrlWithHeuristicONNX } from "./loadAndPredict.js";

// export async function checkMLResult(url) {
//     try {
//       const result = await predictUrlWithHeuristicONNX(url);
  
//       if (!result || !result.final_prediction) {
//         return { blocked: false, score: 0, reason: "ML error", layer: "ml_heuristic" };
//       }
  
//       const pred = result.final_prediction;
//       const conf = result.final_probabilities?.[pred] || 0;
//       const blocked = pred !== "benign" && conf > 0.6;
  
//       return {
//         blocked,
//         score: conf,
//         reason: `ML+Heuristic: ${result.detection_reason}`,
//         layer: "ml_heuristic",
  
//         // Keep full context for debugging
//         raw: result
//       };
//     } catch (e) {
//       console.error("❌ ML+Heuristic check failed:", e);
//       return { blocked: false, score: 0, reason: "ML failure", layer: "ml_heuristic" };
//     }
//   }
  

export async function checkMLResult(url) {
  try {
    const result = await predictUrlWithHeuristicONNX(url);

    if (!result || !result.final_prediction) {
      return { blocked: false, score: 0, reason: "ML error", layer: "ml_heuristic" };
    }

    const pred = result.final_prediction;                       
    const conf = result.final_probabilities?.[pred] || 0;

    let blocked = false;
    let needsBackend = true;

    if (pred !== "benign" && conf >= 0.80) {
      blocked = true;
    }

    else if (pred !== "benign" && conf > 0.40 && conf < 0.80) {
      needsBackend = true;
    }

    else if (pred === "benign" && conf >= 0.65) {
      blocked = false;
    }

    else if (pred === "benign" && conf < 0.65) {
      needsBackend = true;
    }

    else if(pred !== "benign" && conf < 0.40){
      needsBackend = false;
    }

    return {
      blocked,
      needsBackend,
      score: conf,
      category: pred,
      reason: `ML+Heuristic: ${result.detection_reason}`,
      layer: "ml_heuristic",
      raw: result
    };

  } catch (e) {
    console.error("❌ ML+Heuristic check failed:", e);
    return { blocked: false, score: 0, reason: "ML failure", layer: "ml_heuristic" };
  }
}
