from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import insightface
from insightface.app import FaceAnalysis
import numpy as np
import cv2
from PIL import Image
import io
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Face Recognition Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize InsightFace model (Buffalo_L for best accuracy)
face_app = None

@app.on_event("startup")
async def startup_event():
    global face_app
    logger.info("Loading InsightFace Buffalo_L model...")
    face_app = FaceAnalysis(
        name='buffalo_l',
        providers=['CPUExecutionProvider']  # Use 'CUDAExecutionProvider' if GPU available
    )
    face_app.prepare(ctx_id=0, det_size=(640, 640))
    logger.info("InsightFace model loaded successfully!")

def load_image_from_upload(file: UploadFile) -> np.ndarray:
    """Load image from upload and convert to BGR format for OpenCV"""
    image_bytes = file.file.read()
    image = Image.open(io.BytesIO(image_bytes))
    # Convert to RGB then BGR for OpenCV
    image_np = np.array(image.convert('RGB'))
    image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    return image_bgr

@app.get("/")
async def root():
    return {"status": "ok", "service": "Face Recognition API"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model": "buffalo_l",
        "model_loaded": face_app is not None
    }

@app.post("/detect")
async def detect_face(image: UploadFile = File(...)):
    """
    Detect faces in an image
    Returns: Number of faces detected and confidence
    """
    try:
        img = load_image_from_upload(image)
        faces = face_app.get(img)

        if len(faces) == 0:
            return {
                "detected": False,
                "face_count": 0,
                "message": "No face detected"
            }

        if len(faces) > 1:
            return {
                "detected": False,
                "face_count": len(faces),
                "message": f"Multiple faces detected ({len(faces)})"
            }

        # Single face detected
        face = faces[0]
        return {
            "detected": True,
            "face_count": 1,
            "confidence": float(face.det_score),
            "message": "Single face detected successfully"
        }

    except Exception as e:
        logger.error(f"Error detecting face: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-embedding")
async def extract_embedding(image: UploadFile = File(...)):
    """
    Extract 512-dimensional face embedding from image
    Returns: Embedding array or error
    """
    try:
        img = load_image_from_upload(image)
        faces = face_app.get(img)

        if len(faces) == 0:
            raise HTTPException(status_code=400, detail="No face detected in image")

        if len(faces) > 1:
            raise HTTPException(
                status_code=400,
                detail=f"Multiple faces detected ({len(faces)}). Please provide image with single face."
            )

        face = faces[0]
        embedding = face.normed_embedding.tolist()  # Convert to list for JSON

        return {
            "success": True,
            "embedding": embedding,
            "confidence": float(face.det_score),
            "embedding_size": len(embedding)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compare")
async def compare_faces(
    image1: UploadFile = File(...),
    image2: UploadFile = File(...)
):
    """
    Compare two faces and return similarity score
    Returns: Similarity percentage (0-100)
    """
    try:
        # Extract embeddings from both images
        img1 = load_image_from_upload(image1)
        img2 = load_image_from_upload(image2)

        faces1 = face_app.get(img1)
        faces2 = face_app.get(img2)

        if len(faces1) == 0 or len(faces2) == 0:
            raise HTTPException(status_code=400, detail="Face not detected in one or both images")

        if len(faces1) > 1 or len(faces2) > 1:
            raise HTTPException(status_code=400, detail="Multiple faces detected in one or both images")

        # Calculate cosine similarity
        emb1 = faces1[0].normed_embedding
        emb2 = faces2[0].normed_embedding

        similarity = float(np.dot(emb1, emb2))  # Already normalized, so dot product = cosine similarity
        confidence_percent = (similarity + 1) * 50  # Convert from [-1, 1] to [0, 100]

        return {
            "success": True,
            "similarity": similarity,
            "confidence": confidence_percent,
            "same_person": confidence_percent >= 70.0  # Threshold
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing faces: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
