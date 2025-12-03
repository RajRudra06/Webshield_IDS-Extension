import onnx
from onnx_tf.backend import prepare
import tensorflowjs as tfjs

print("🔄 Starting ONNX → TensorFlow.js conversion...")

# Step 1: Load your ONNX model
print("📂 Loading ONNX model...")
onnx_model = onnx.load("lightGBMClassifier.onnx")
print("✅ ONNX model loaded")

# Step 2: Convert ONNX to TensorFlow
print("🔄 Converting to TensorFlow...")
tf_rep = prepare(onnx_model)
print("✅ Converted to TensorFlow")

# Step 3: Export as TensorFlow SavedModel
print("💾 Exporting TensorFlow model...")
tf_rep.export_graph("tf_model")
print("✅ TensorFlow model exported")

# Step 4: Convert to TensorFlow.js
print("🔄 Converting to TensorFlow.js...")
tfjs.converters.convert_tf_saved_model(
    "tf_model",
    "tfjs_model"
)
print("✅ TensorFlow.js model created")

print("\n🎉 Conversion complete!")
print("📁 Output folder: tfjs_model/")
print("   Files created:")
print("   ├── model.json")
print("   └── group1-shard1of1.bin (or similar .bin file)")

