import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as faceapi from '@vladmandic/face-api';
import * as canvas from 'canvas';
import { join } from 'path';

// Configure face-api.js to use node-canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as any);

@Injectable()
export class FacialRecognitionService implements OnModuleInit {
  private readonly logger = new Logger(FacialRecognitionService.name);
  private modelsLoaded = false;
  private readonly modelsPath = join(process.cwd(), 'models');

  async onModuleInit() {
    await this.loadModels();
  }

  /**
   * Load face-api.js models on application startup
   */
  private async loadModels(): Promise<void> {
    try {
      this.logger.log(`Loading face-api.js models from: ${this.modelsPath}`);

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromDisk(this.modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelsPath),
      ]);

      this.modelsLoaded = true;
      this.logger.log('Face-api.js models loaded successfully (TinyFaceDetector)');
    } catch (error) {
      this.logger.error('Failed to load face-api.js models', error);
      throw new Error('Facial recognition models could not be loaded');
    }
  }

  /**
   * Detect a single face in the image and validate it's suitable for recognition
   * @param imageBuffer - Image buffer (JPEG/PNG)
   * @returns True if a valid face is detected, false otherwise
   */
  async detectFace(imageBuffer: Buffer): Promise<boolean> {
    if (!this.modelsLoaded) {
      throw new Error('Face recognition models not loaded');
    }

    try {
      const img = await canvas.loadImage(imageBuffer);
      const detections = await faceapi
        .detectAllFaces(img as any, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      // Must have exactly one face
      if (detections.length === 0) {
        this.logger.warn('No face detected in image');
        return false;
      }

      if (detections.length > 1) {
        this.logger.warn(`Multiple faces detected (${detections.length})`);
        return false;
      }

      // Check face detection score (confidence)
      const detection = detections[0];
      if (detection.detection.score < 0.5) {
        this.logger.warn(
          `Face detection confidence too low: ${detection.detection.score}`,
        );
        return false;
      }

      this.logger.log(
        `Face detected successfully with confidence: ${detection.detection.score.toFixed(3)}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error detecting face', error);
      return false;
    }
  }

  /**
   * Extract 128-dimensional face embedding from image
   * @param imageBuffer - Image buffer (JPEG/PNG)
   * @returns Float32Array of 128 dimensions, or null if no valid face found
   */
  async extractEmbedding(imageBuffer: Buffer): Promise<Float32Array | null> {
    if (!this.modelsLoaded) {
      throw new Error('Face recognition models not loaded');
    }

    try {
      const img = await canvas.loadImage(imageBuffer);

      const detection = await faceapi
        .detectSingleFace(img as any, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        this.logger.warn('No face detected for embedding extraction');
        return null;
      }

      // detection.descriptor is a Float32Array of 128 dimensions
      const embedding = detection.descriptor;

      this.logger.log(
        `Extracted face embedding: 128D vector, detection score: ${detection.detection.score.toFixed(3)}`,
      );

      return embedding;
    } catch (error) {
      this.logger.error('Error extracting face embedding', error);
      return null;
    }
  }

  /**
   * Compare two face embeddings and calculate similarity
   * @param embedding1 - First face embedding (128D)
   * @param embedding2 - Second face embedding (128D)
   * @returns Euclidean distance (lower = more similar, typically 0-1 range)
   */
  compareEmbeddings(
    embedding1: Float32Array,
    embedding2: Float32Array,
  ): number {
    if (embedding1.length !== 128 || embedding2.length !== 128) {
      throw new Error('Embeddings must be 128-dimensional');
    }

    // Calculate Euclidean distance
    const distance = faceapi.euclideanDistance(embedding1, embedding2);

    this.logger.debug(`Embedding distance: ${distance.toFixed(4)}`);

    return distance;
  }

  /**
   * Convert Euclidean distance to confidence percentage
   * @param distance - Euclidean distance (0-1)
   * @returns Confidence percentage (0-100)
   *
   * Distance interpretation:
   * - < 0.4: Same person (high confidence)
   * - 0.4-0.6: Likely same person (medium confidence)
   * - > 0.6: Different person (low confidence)
   */
  calculateConfidence(distance: number): number {
    // Convert distance to confidence percentage
    // Distance of 0 = 100% confidence
    // Distance of 0.6 = 0% confidence
    // Use exponential decay for better distribution
    const confidence = Math.max(
      0,
      Math.min(100, (1 - distance / 0.6) * 100),
    );

    return Math.round(confidence);
  }

  /**
   * Find best match from a list of known embeddings
   * @param checkInEmbedding - Face embedding from check-in photo
   * @param knownEmbeddings - Array of [sontaHeadId, embedding] pairs
   * @returns Best match { sontaHeadId, confidence } or null if no good match
   */
  findBestMatch(
    checkInEmbedding: Float32Array,
    knownEmbeddings: Array<{ sontaHeadId: string; embedding: Float32Array }>,
  ): { sontaHeadId: string; confidence: number; distance: number } | null {
    if (knownEmbeddings.length === 0) {
      this.logger.warn('No known embeddings to compare against');
      return null;
    }

    let bestMatch: {
      sontaHeadId: string;
      confidence: number;
      distance: number;
    } | null = null;
    let lowestDistance = Infinity;

    for (const known of knownEmbeddings) {
      const distance = this.compareEmbeddings(
        checkInEmbedding,
        known.embedding,
      );

      if (distance < lowestDistance) {
        lowestDistance = distance;
        bestMatch = {
          sontaHeadId: known.sontaHeadId,
          confidence: this.calculateConfidence(distance),
          distance,
        };
      }
    }

    if (bestMatch) {
      this.logger.log(
        `Best match: ${bestMatch.sontaHeadId} with confidence ${bestMatch.confidence}% (distance: ${bestMatch.distance.toFixed(4)})`,
      );
    }

    return bestMatch;
  }

  /**
   * Check if face-api.js models are loaded and ready
   */
  isReady(): boolean {
    return this.modelsLoaded;
  }
}
