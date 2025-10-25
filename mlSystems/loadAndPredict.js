import * as ort from "onnxruntime-web";
import { apply_typosquatting_heuristic } from "./typoSqauttinFunction";
import { extract_features_enhanced } from "./featuresExtraction";

// Must match your training labels
const CLASSES = ["benign", "defacement", "malware", "phishing"];

let mlSession = null;

// --- Load ONNX model once ---
export async function loadMLModel() {
  try {
    const modelUrl = chrome.runtime.getURL("ml_systems/lightGBMClassifier.onnx");
    mlSession = await ort.InferenceSession.create(modelUrl);
    console.log("🤖 ONNX model loaded");
  } catch (error) {
    console.error("❌ Failed to load ONNX model:", error);
    mlSession = null;
  }
}

// --- Full inference + heuristic pipeline ---
export async function processUrlWithHeuristicONNX(url) {
  try {
    if (!mlSession) {
      console.error("❌ ONNX model not loaded");
      return null;
    }

    // ---- Step 1: Normalize URL ----
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // ---- Step 2: Feature extraction ----
    const featuresDict = extract_features_enhanced(url); // JS equivalent of extract_features_enhanced()
    const features = Object.values(featuresDict); // array of 66 numeric features

    // ---- Step 3: Ensure correct input ----
    const inputTensor = new ort.Tensor("float32", Float32Array.from(features), [1, 66]);

    // ---- Step 4: Model inference ----
    const output = await mlSession.run({ input: inputTensor });
    const resultKey = Object.keys(output)[0];
    const probs = Array.from(output[resultKey].data); // e.g., [P(benign), P(defacement), P(malware), P(phishing)]

    // ---- Step 5: Build probability map ----
    const probDict = {};
    CLASSES.forEach((cls, i) => {
      probDict[cls] = parseFloat(probs[i].toFixed(6));
    });

    // ---- Step 6: Pick predicted class ----
    const maxIndex = probs.indexOf(Math.max(...probs));
    const modelPred = CLASSES[maxIndex];

    // ---- Step 7: Apply heuristic ----
    const heuristicResult = apply_typosquatting_heuristic(url, modelPred, probDict);

    // ---- Step 8: Return same structure as Python ----
    return {
      url,
      model_prediction: modelPred,
      model_probabilities: probDict,
      final_prediction: heuristicResult.final_pred || modelPred,
      final_probabilities: heuristicResult.final_proba || probDict,
      detection_reason: heuristicResult.reason || "model_decision",
      heuristic_applied: heuristicResult.reason !== "model_decision"
    };

  } catch (error) {
    console.error("❌ ONNX inference failed:", error);
    return {
      url,
      model_prediction: null,
      model_probabilities: {},
      final_prediction: "unknown",
      final_probabilities: {},
      detection_reason: "error",
      heuristic_applied: false
    };
  }
}
