import * as ort from "./ort.min.js";
import { apply_typosquatting_heuristic } from "./typoSqauttinFunction.js";
import { extract_features_enhanced } from "./featuresExtraction.js";

// Must match your training labels
const CLASSES = ["benign", "defacement", "malware", "phishing"];

let mlSession = null;

// --- Load ONNX model once ---
export async function loadMLModel() {
  try {
    ort.env.wasm.wasmPaths = chrome.runtime.getURL("mlSystems/");
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = false; // Disable SIMD for service worker compatibility

    const modelUrl = chrome.runtime.getURL("mlSystems/lightGBMClassifier.onnx");
    
    mlSession = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ['wasm']
    });

    console.log("🔍 Model Metadata:");
    console.log("  Inputs:", mlSession.inputNames);
    console.log("  Outputs:", mlSession.outputNames);

    console.log("🤖 ONNX model loaded");
  } catch (error) {
    console.error("❌ Failed to load ONNX model:", error);
    mlSession = null;
  }
}

export async function predictUrlWithHeuristicONNX(url) {
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
    const featuresDict = extract_features_enhanced(url);
    const features = Object.values(featuresDict); // array of 66 numeric features

    // ---- Step 3: Ensure correct input ----
    const inputTensor = new ort.Tensor("float32", Float32Array.from(features), [1, 66]);

    // ---- Step 4: Model inference ----
    const output = await mlSession.run({ input: inputTensor });
    console.log("📊 ONNX outputs:", Object.keys(output));

    // ---- Step 5: Get probabilities from correct output ----
    let probs;

    if (output.probabilities) {
      console.log("✅ Using 'probabilities' output");
      console.log("   Type:", output.probabilities.type);
      console.log("   Dims:", output.probabilities.dims);
      
      // Check if data exists (instead of type === 'tensor')
      if (output.probabilities.data) {
        probs = Array.from(output.probabilities.data);
        console.log("📈 Probabilities:", probs);
      } else {
        console.error("❌ Probabilities output has no data property!");
        throw new Error("Invalid model output format - no data");
      }
    } else if (output.label) {
      console.warn("⚠️ No 'probabilities' output found, using 'label'");
      
      if (output.label.data) {
        probs = Array.from(output.label.data);
      } else {
        throw new Error("Label output has no data");
      }
    } else {
      console.error("❌ No valid output found!");
      console.log("Available outputs:", Object.keys(output));
      throw new Error("Cannot find model outputs");
    }

    // Verify we got 4 probabilities (one for each class)
    if (probs.length !== 4) {
      console.error(`❌ Expected 4 probabilities, got ${probs.length}`);
      throw new Error(`Invalid probability count: ${probs.length}`);
    }

    // ---- Step 6: Build probability map ----
    const probDict = {};
    CLASSES.forEach((cls, i) => {
      probDict[cls] = parseFloat(probs[i].toFixed(6));
    });

    // ---- Step 7: Pick predicted class ----
    const maxIndex = probs.indexOf(Math.max(...probs));
    const modelPred = CLASSES[maxIndex];

    // ---- Step 8: Apply heuristic ----
    const heuristicResult = apply_typosquatting_heuristic(url, modelPred, probDict);

    // ---- Step 9: Return same structure as Python ----
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