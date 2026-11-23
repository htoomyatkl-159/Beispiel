
export interface PythonSimilarRequest { sourceTrackId: string; catalogVersion: string; limit: number }
export interface PythonSimilarTrack { sourceTrackId: string; title: string; artists: string; cosineDistance: number; cosineSimilarity: number; reasonCode: string }
export interface PythonSimilarResponse { seedSourceTrackId: string; catalogVersion: string; modelVersion: string; results: PythonSimilarTrack[] }

export class RecommenderUnavailableError extends Error {}
export class RecommenderContractError extends Error {}

export interface RecommenderClient { similar(input: PythonSimilarRequest): Promise<PythonSimilarResponse> }

function isResponse(value: unknown): value is PythonSimilarResponse {
  if (!value || typeof value !== 'object') return false;
  const body = value as Record<string, unknown>;
  return typeof body.seedSourceTrackId === 'string' && typeof body.catalogVersion === 'string' &&
    typeof body.modelVersion === 'string' && Array.isArray(body.results) && body.results.every((row) => {
      if (!row || typeof row !== 'object') return false;
      const item = row as Record<string, unknown>;
      return typeof item.sourceTrackId === 'string' && typeof item.title === 'string' &&
        typeof item.artists === 'string' && typeof item.cosineDistance === 'number' &&
        typeof item.cosineSimilarity === 'number' && item.reasonCode === 'SIMILAR_AUDIO_FEATURES';
    });
}

export function createRecommenderClient(baseUrl: string, timeoutMs = 2500): RecommenderClient {
  const base = baseUrl.replace(/\/$/, '');
  return { async similar(input) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${base}/v1/similar`, { method: 'POST', signal: controller.signal,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const body: unknown = await response.json().catch(() => null);
      if (response.status === 404 || response.status === 409) throw new RecommenderContractError(`Python service rejected the catalog request (${response.status}).`);
      if (!response.ok) throw new RecommenderUnavailableError(`Python service returned ${response.status}.`);
      if (!isResponse(body)) throw new RecommenderContractError('Python service returned an invalid recommendation response.');
      return body;
    } catch (error) {
      if (error instanceof RecommenderContractError) throw error;
      if (error instanceof RecommenderUnavailableError) throw error;
      throw new RecommenderUnavailableError('Python recommendation service is unavailable.');
    } finally { clearTimeout(timer); controller.abort(); }
  } };
}
