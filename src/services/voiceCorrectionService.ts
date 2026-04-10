/**
 * Voice Correction Service
 * Uses semantic vector search to normalize misheard voice transcripts
 * (e.g., 'kidney' -> 'kitney', 'add task' -> 'create_task')
 */

export interface NormalizationResult {
  normalized: string;
  original: string;
  corrected: boolean;
  similarity?: number;
}

class VoiceCorrectionService {
  private API_BASE = '/api/voice';

  /**
   * Normalizes a transcript using the serverless vector corrector
   */
  async normalize(transcript: string): Promise<NormalizationResult> {
    if (!transcript || transcript.trim().length < 2) {
      return { normalized: transcript, original: transcript, corrected: false };
    }

    try {
      const response = await fetch(`${this.API_BASE}/normalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        throw new Error(`Normalization failed with status: ${response.status}`);
      }

      const data: NormalizationResult = await response.json();
      
      if (data.corrected) {
        console.log(`[VoiceCorrection] Normalized: "${transcript}" -> "${data.normalized}" (Similarity: ${data.similarity?.toFixed(2)})`);
      }

      return data;
    } catch (error) {
      console.error('[VoiceCorrection] Error during normalization:', error);
      // Fallback to original transcript if normalization fails
      return { normalized: transcript, original: transcript, corrected: false };
    }
  }
}

export const voiceCorrectionService = new VoiceCorrectionService();
