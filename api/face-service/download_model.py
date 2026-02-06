"""Pre-download InsightFace model during Docker build to avoid runtime download."""
import os
import insightface
from insightface.app import FaceAnalysis

model_name = os.environ.get('FACE_MODEL', 'buffalo_sc')
print(f"Pre-downloading InsightFace {model_name} model...")

app = FaceAnalysis(name=model_name, providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(320, 320))

print(f"Model {model_name} downloaded and verified successfully!")
