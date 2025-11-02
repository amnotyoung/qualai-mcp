/**
 * RAG (Retrieval-Augmented Generation) types
 */

export interface RAGConfig {
  vectorDB: {
    type: 'qdrant' | 'local';
    url?: string;
    apiKey?: string;
    collectionName: string;
  };
  embedding: {
    provider: 'openai' | 'cohere' | 'local';
    model: string;
    dimensions: number;
    apiKey?: string;
  };
  search: {
    topK: number;
    scoreThreshold: number;
    rerank?: boolean;
  };
}

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: Record<string, any>;
}

export interface SearchResult<T = any> {
  id: string;
  score: number;
  payload: T;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface RAGQuery {
  query: string;
  filters?: Record<string, any>;
  topK?: number;
  scoreThreshold?: number;
}

export interface RAGResponse<T = any> {
  results: SearchResult<T>[];
  query: string;
  totalResults: number;
  processingTime: number;
}
