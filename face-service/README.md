# Face Recognition Microservice

Python FastAPI service using InsightFace for high-accuracy facial recognition.

## Features

- **Industry-grade accuracy**: InsightFace Buffalo_L model (95%+ accuracy)
- **512D face embeddings**: More accurate than face-api.js 128D
- **Fast processing**: ONNX Runtime optimization
- **Simple HTTP API**: Easy integration with any backend

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "model": "buffalo_l",
  "model_loaded": true
}
```

### POST /detect
Detect faces in an image

**Request:** multipart/form-data with `image` file

**Response:**
```json
{
  "detected": true,
  "face_count": 1,
  "confidence": 0.998,
  "message": "Single face detected successfully"
}
```

### POST /extract-embedding
Extract 512D face embedding from image

**Request:** multipart/form-data with `image` file

**Response:**
```json
{
  "success": true,
  "embedding": [0.123, 0.456, ...],  // 512 floats
  "confidence": 0.998,
  "embedding_size": 512
}
```

### POST /compare
Compare two face images

**Request:** multipart/form-data with `image1` and `image2` files

**Response:**
```json
{
  "success": true,
  "similarity": 0.95,
  "confidence": 97.5,
  "same_person": true
}
```

## Local Development

### Install dependencies
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Run the service
```bash
python app.py
```

Service will be available at http://localhost:8000

### Test the service
```bash
# Health check
curl http://localhost:8000/health

# Test face detection (with test image)
curl -X POST http://localhost:8000/detect \
  -F "image=@test-face.jpg"
```

## Docker Deployment

### Build image
```bash
docker build -t face-recognition-service .
```

### Run container
```bash
docker run -p 8000:8000 face-recognition-service
```

### Docker Compose (recommended)
Already configured in main `docker-compose.yml`

## Performance

- **First startup**: ~30-60 seconds (downloads Buffalo_L model ~400MB)
- **Face detection**: ~100-200ms per image
- **Embedding extraction**: ~150-300ms per image
- **Memory usage**: ~2GB RAM

## GPU Support

To enable GPU acceleration:

1. Install CUDA and cuDNN
2. Install GPU-enabled ONNX Runtime:
   ```bash
   pip install onnxruntime-gpu
   ```
3. Update `app.py`:
   ```python
   providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
   ```

## Model Information

- **Model**: Buffalo_L
- **Provider**: InsightFace
- **Embedding size**: 512 dimensions
- **Accuracy**: 95%+ for same person
- **License**: MIT

## Troubleshooting

### Model download fails
- Check internet connection
- Models download to `~/.insightface/models/`
- Can be cached with Docker volume

### "Multiple faces detected" error
- Ensure only one person in photo
- Use cropped/centered face images
- Check image quality

### Low accuracy scores
- Ensure good lighting conditions
- Face should be front-facing
- Minimum resolution: 640x640 recommended

## Integration with NestJS

The NestJS backend calls this service via HTTP:

```typescript
// Extract embedding
const formData = new FormData();
formData.append('image', imageBuffer, { filename: 'image.jpg' });
const response = await axios.post(
  'http://face-service:8000/extract-embedding',
  formData
);
const embedding = new Float32Array(response.data.embedding);
```
