import { predictUrlWithHeuristicONNX } from "./loadAndPredict";

export async function checkMLResult(url) {
    try {
      const result = await predictUrlWithHeuristicONNX(url);
  
      if (!result || !result.final_prediction) {
        return { blocked: false, score: 0, reason: "ML error", layer: "ml_heuristic" };
      }
  
      const pred = result.final_prediction;
      const conf = result.final_probabilities?.[pred] || 0;
      const blocked = pred !== "benign" && conf > 0.6;
  
      return {
        blocked,
        score: conf,
        reason: `ML+Heuristic: ${result.detection_reason}`,
        layer: "ml_heuristic",
  
        // Keep full context for debugging
        raw: result
      };
    } catch (e) {
      console.error("❌ ML+Heuristic check failed:", e);
      return { blocked: false, score: 0, reason: "ML failure", layer: "ml_heuristic" };
    }
  }
  