import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class FacialRecognitionService implements OnModuleInit {
  private readonly logger = new Logger(FacialRecognitionService.name);
  private readonly faceServiceUrl =
    process.env.FACE_SERVICE_URL || 'http://localhost:8000';
  private serviceReady = false;

  async onModuleInit() {
    // Non-blocking: let backend start while face-service loads
    this.waitForService();
  }

  private async waitForService(
    maxRetries = 10,
    delayMs = 3000,
  ): Promise<void> {
    this.logger.log(
      `Waiting for face service at ${this.faceServiceUrl}...`,
    );

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get<{
          model_loaded: boolean;
          model: string;
        }>(`${this.faceServiceUrl}/health`, { timeout: 5000 });
        this.serviceReady = response.data.model_loaded;
        this.logger.log(
          `Face service is ready (model: ${response.data.model})`,
        );
        return;
      } catch {
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    this.logger.warn(
      `Face service not available after ${maxRetries} attempts — facial recognition will be unavailable`,
    );
    this.serviceReady = false;
  }

  async ensureReady(): Promise<void> {
    if (!this.serviceReady) {
      // Try one more health check in case service just became available
      try {
        const response = await axios.get<{ model_loaded: boolean }>(
          `${this.faceServiceUrl}/health`,
          { timeout: 3000 },
        );
        this.serviceReady = response.data.model_loaded;
      } catch {
        // still not ready
      }
    }
    if (!this.serviceReady) {
      throw new Error(
        'Face recognition service is still loading. Please try again in a few seconds.',
      );
    }
  }

  async detectFace(imageBuffer: Buffer): Promise<boolean> {
    await this.ensureReady();

    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      });

      const response = await axios.post(
        `${this.faceServiceUrl}/detect`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 10000,
        },
      );

      if (!response.data.detected) {
        this.logger.warn(response.data.message);
        return false;
      }

      this.logger.log(
        `Face detected with confidence: ${response.data.confidence.toFixed(3)}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error detecting face', error.message);
      return false;
    }
  }

  async extractEmbedding(imageBuffer: Buffer): Promise<Float32Array | null> {
    await this.ensureReady();

    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      });

      const response = await axios.post(
        `${this.faceServiceUrl}/extract-embedding`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 10000,
        },
      );

      if (!response.data.success) {
        this.logger.warn('Failed to extract embedding');
        return null;
      }

      // Convert array to Float32Array (InsightFace returns 512D embedding)
      const embedding = new Float32Array(response.data.embedding);

      this.logger.log(
        `Extracted face embedding: ${embedding.length}D vector, confidence: ${response.data.confidence.toFixed(3)}`,
      );

      return embedding;
    } catch (error) {
      if (error.response?.status === 400) {
        this.logger.warn(
          `Face extraction failed: ${error.response.data.detail}`,
        );
      } else {
        this.logger.error('Error extracting embedding', error.message);
      }
      return null;
    }
  }

  compareEmbeddings(
    embedding1: Float32Array,
    embedding2: Float32Array,
  ): number {
    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

    // Convert similarity [-1, 1] to distance [0, 1]
    // Similarity of 1 = distance of 0 (identical)
    // Similarity of -1 = distance of 1 (completely different)
    const distance = (1 - similarity) / 2;

    this.logger.debug(`Embedding distance: ${distance.toFixed(4)}`);
    return distance;
  }

  calculateConfidence(distance: number): number {
    // Convert distance to confidence percentage
    // Distance of 0 = 100% confidence (identical)
    // Distance of 0.5 = 0% confidence (completely different)
    const confidence = Math.max(0, Math.min(100, (1 - distance / 0.5) * 100));
    return Math.round(confidence);
  }

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
      const distance = this.compareEmbeddings(checkInEmbedding, known.embedding);

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

  isReady(): boolean {
    return this.serviceReady;
  }
}
