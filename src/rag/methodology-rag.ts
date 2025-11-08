/**
 * RAG system for community-contributed methodologies
 */

import { Octokit } from '@octokit/rest';
import type { Methodology, MethodologyDocument, MethodologySearchQuery, MethodologySearchResult } from '../types/methodology.js';
import type { RAGConfig, VectorPoint, SearchResult } from '../types/rag.js';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Get the qualai data directory path
 * Uses QUALAI_DATA_DIR environment variable or defaults to ~/.qualai
 */
function getQualaiDataDir(): string {
  return process.env.QUALAI_DATA_DIR || path.join(os.homedir(), '.qualai');
}

export class MethodologyRAG {
  private qdrant: QdrantClient | null = null;
  private openai: OpenAI | null = null;
  private config: RAGConfig;
  private localMethodologies: Map<string, Methodology> = new Map();
  private localMode: boolean = false;

  constructor(config?: Partial<RAGConfig>) {
    this.config = {
      vectorDB: {
        type: config?.vectorDB?.type || 'local',
        url: config?.vectorDB?.url || process.env.QDRANT_URL,
        collectionName: config?.vectorDB?.collectionName || 'qualitative_methodologies',
      },
      embedding: {
        provider: config?.embedding?.provider || 'openai',
        model: config?.embedding?.model || 'text-embedding-3-small',
        dimensions: config?.embedding?.dimensions || 1536,
        apiKey: config?.embedding?.apiKey || process.env.OPENAI_API_KEY,
      },
      search: {
        topK: config?.search?.topK || 5,
        scoreThreshold: config?.search?.scoreThreshold || 0.5,
        rerank: config?.search?.rerank || false,
      },
    };

    this.initialize();
  }

  private async initialize() {
    // Try to initialize Qdrant
    if (this.config.vectorDB.type === 'qdrant' && this.config.vectorDB.url) {
      try {
        this.qdrant = new QdrantClient({ url: this.config.vectorDB.url });
        await this.ensureCollection();
      } catch (error) {
        console.warn('Qdrant not available, falling back to local mode:', error);
        this.localMode = true;
      }
    } else {
      this.localMode = true;
    }

    // Initialize OpenAI if API key is available
    if (this.config.embedding.apiKey) {
      this.openai = new OpenAI({ apiKey: this.config.embedding.apiKey });
    }

    // Load local methodologies
    await this.loadLocalMethodologies();
  }

  private async ensureCollection() {
    if (!this.qdrant) return;

    try {
      await this.qdrant.getCollection(this.config.vectorDB.collectionName);
    } catch {
      // Collection doesn't exist, create it
      await this.qdrant.createCollection(this.config.vectorDB.collectionName, {
        vectors: {
          size: this.config.embedding.dimensions,
          distance: 'Cosine',
        },
      });
    }
  }

  /**
   * Load methodologies from local filesystem
   */
  private async loadLocalMethodologies() {
    const methodologiesDir = path.join(getQualaiDataDir(), 'methodologies');

    if (!fs.existsSync(methodologiesDir)) {
      fs.mkdirSync(methodologiesDir, { recursive: true });
      // Create default methodologies
      await this.createDefaultMethodologies();
      return;
    }

    const files = fs.readdirSync(methodologiesDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(methodologiesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const methodology = JSON.parse(content) as Methodology;
        this.localMethodologies.set(methodology.id, methodology);
      }
    }

    console.error(`Loaded ${this.localMethodologies.size} local methodologies`);
  }

  /**
   * Create default methodologies (Grounded Theory, Thematic Analysis, Phenomenology)
   */
  private async createDefaultMethodologies() {
    // This will be implemented with actual methodology definitions
    console.error('Creating default methodologies...');
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      // Fallback: simple hash-based embedding for local mode
      return this.simpleEmbedding(text);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.config.embedding.model,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.warn('OpenAI embedding failed, using fallback:', error);
      return this.simpleEmbedding(text);
    }
  }

  /**
   * Simple embedding fallback (for local mode without API)
   */
  private simpleEmbedding(text: string): number[] {
    // Very simple: create a fixed-size vector based on text characteristics
    const vector = new Array(this.config.embedding.dimensions).fill(0);
    const words = text.toLowerCase().split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const hash = this.simpleHash(word);
      const index = hash % this.config.embedding.dimensions;
      vector[index] += 1;
    }

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map(v => v / (magnitude || 1));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Find methodologies matching the query
   */
  async findMethodology(query: MethodologySearchQuery): Promise<MethodologySearchResult[]> {
    const queryText = this.buildQueryText(query);

    if (this.localMode || !this.qdrant) {
      return this.localSearch(queryText, query);
    }

    try {
      const embedding = await this.generateEmbedding(queryText);

      const searchResults = await this.qdrant.search(this.config.vectorDB.collectionName, {
        vector: embedding,
        limit: this.config.search.topK,
        score_threshold: this.config.search.scoreThreshold,
        filter: {
          must: [{ key: 'metadata.validated', match: { value: true } }],
        },
      });

      return searchResults.map(result => ({
        methodology: result.payload as unknown as Methodology,
        score: result.score,
        fitScore: this.calculateFitScore(result.payload as any, query),
        reasoning: this.generateReasoning(result.payload as any, query),
      }));
    } catch (error) {
      console.warn('Vector search failed, using local fallback:', error);
      return this.localSearch(queryText, query);
    }
  }

  /**
   * Local search fallback
   */
  private localSearch(queryText: string, query: MethodologySearchQuery): MethodologySearchResult[] {
    const results: MethodologySearchResult[] = [];
    const queryLower = queryText.toLowerCase();

    for (const methodology of this.localMethodologies.values()) {
      // Simple keyword matching
      const searchText = `
        ${methodology.name}
        ${methodology.description}
        ${methodology.category}
        ${methodology.stages.map(s => s.description).join(' ')}
      `.toLowerCase();

      let score = 0;

      // Calculate basic relevance score
      const keywords = queryLower.split(/\s+/);
      for (const keyword of keywords) {
        if (searchText.includes(keyword)) {
          score += 1;
        }
      }

      if (score > 0) {
        const fitScore = this.calculateFitScore(methodology, query);

        results.push({
          methodology,
          score: score / keywords.length,
          fitScore,
          reasoning: this.generateReasoning(methodology, query),
        });
      }
    }

    // Sort by combined score
    results.sort((a, b) => {
      const scoreA = a.score * 0.5 + a.fitScore * 0.5;
      const scoreB = b.score * 0.5 + b.fitScore * 0.5;
      return scoreB - scoreA;
    });

    return results.slice(0, this.config.search.topK);
  }

  /**
   * Build query text from structured query
   */
  private buildQueryText(query: MethodologySearchQuery): string {
    const parts: string[] = [query.intent];

    if (query.dataType) parts.push(`data type: ${query.dataType}`);
    if (query.researchGoal) parts.push(`research goal: ${query.researchGoal}`);
    if (query.paradigm) parts.push(`paradigm: ${query.paradigm}`);
    if (query.sampleSize) parts.push(`sample size: ${query.sampleSize}`);

    return parts.join(', ');
  }

  /**
   * Calculate fit score based on methodology characteristics
   */
  private calculateFitScore(methodology: any, query: MethodologySearchQuery): number {
    let score = 0;
    let factors = 0;

    // Category match
    if (query.researchGoal) {
      if (methodology.category === query.researchGoal ||
          methodology.category === 'mixed') {
        score += 0.3;
      }
      factors++;
    }

    // Sample size appropriateness
    if (query.sampleSize) {
      const minSize = methodology.stages?.find((s: any) => s.minimumSampleSize)?.minimumSampleSize || 10;
      if (query.sampleSize >= minSize) {
        score += 0.2;
      } else {
        score += 0.1; // Partial credit
      }
      factors++;
    }

    // Expertise level (if methodology has difficulty rating)
    if (query.expertise && methodology.metadata?.difficulty) {
      const difficultyMatch = {
        beginner: 'easy',
        intermediate: 'medium',
        advanced: 'hard',
      };
      if (methodology.metadata.difficulty === difficultyMatch[query.expertise]) {
        score += 0.2;
      }
      factors++;
    }

    // Usage/popularity (higher citation = more reliable)
    if (methodology.metadata?.citations > 50) {
      score += 0.15;
      factors++;
    } else if (methodology.metadata?.citations > 10) {
      score += 0.1;
      factors++;
    }

    // Validation status
    if (methodology.validated) {
      score += 0.15;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Generate reasoning for why this methodology was recommended
   */
  private generateReasoning(methodology: any, query: MethodologySearchQuery): string {
    const reasons: string[] = [];

    if (methodology.category === query.researchGoal) {
      reasons.push(`Matches your research goal (${query.researchGoal})`);
    }

    if (methodology.validated) {
      reasons.push('Community-validated methodology');
    }

    if (methodology.metadata?.citations > 50) {
      reasons.push(`Highly cited (${methodology.metadata.citations} uses)`);
    }

    if (query.sampleSize) {
      reasons.push(`Appropriate for your sample size (${query.sampleSize})`);
    }

    return reasons.join('; ') || 'Good general match for your criteria';
  }

  /**
   * Get specific methodology by ID
   */
  async getMethodology(id: string): Promise<Methodology | null> {
    return this.localMethodologies.get(id) || null;
  }

  /**
   * Sync methodologies from GitHub repository
   */
  async syncFromGitHub(repo: string, token?: string): Promise<number> {
    const octokit = new Octokit({ auth: token || process.env.GITHUB_TOKEN });

    const [owner, repoName] = repo.split('/');

    try {
      // Get methodologies directory
      const { data: contents } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: 'methodologies',
      });

      let synced = 0;

      if (Array.isArray(contents)) {
        for (const item of contents) {
          if (item.type === 'dir') {
            // Load methodology from directory
            const methodology = await this.loadMethodologyFromGitHub(octokit, owner, repoName, item.path);
            if (methodology) {
              this.localMethodologies.set(methodology.id, methodology);
              synced++;

              // Save locally
              const localPath = path.join(getQualaiDataDir(), 'methodologies', `${methodology.id}.json`);
              fs.writeFileSync(localPath, JSON.stringify(methodology, null, 2));
            }
          }
        }
      }

      console.error(`Synced ${synced} methodologies from GitHub`);
      return synced;
    } catch (error) {
      console.error('Failed to sync from GitHub:', error);
      return 0;
    }
  }

  /**
   * Load methodology from GitHub directory
   */
  private async loadMethodologyFromGitHub(
    octokit: Octokit,
    owner: string,
    repo: string,
    dirPath: string
  ): Promise<Methodology | null> {
    try {
      // Get method.json
      const { data: methodFile } = await octokit.repos.getContent({
        owner,
        repo,
        path: `${dirPath}/method.json`,
      });

      if ('content' in methodFile) {
        const content = Buffer.from(methodFile.content, 'base64').toString('utf-8');
        const methodology = JSON.parse(content) as Methodology;

        // Load prompts
        for (const stage of methodology.stages) {
          if (stage.promptTemplate) {
            try {
              const { data: promptFile } = await octokit.repos.getContent({
                owner,
                repo,
                path: `${dirPath}/${stage.promptTemplate}`,
              });

              if ('content' in promptFile) {
                stage.promptTemplate = Buffer.from(promptFile.content, 'base64').toString('utf-8');
              }
            } catch {
              // Prompt file not found, keep template path
            }
          }
        }

        return methodology;
      }
    } catch (error) {
      console.error(`Failed to load methodology from ${dirPath}:`, error);
    }

    return null;
  }

  /**
   * Rate methodology based on usage
   */
  async rateMethodology(methodologyId: string, rating: {
    successful: boolean;
    userFeedback?: string;
  }): Promise<void> {
    const methodology = this.localMethodologies.get(methodologyId);
    if (!methodology) return;

    // Update usage count
    methodology.metadata.usageCount = (methodology.metadata.usageCount || 0) + 1;

    // Update rating
    if (rating.successful) {
      const currentRating = methodology.metadata.rating || 0;
      const currentCount = methodology.metadata.usageCount || 1;
      methodology.metadata.rating = (currentRating * (currentCount - 1) + 1) / currentCount;
    }

    // Save updated methodology
    const localPath = path.join(getQualaiDataDir(), 'methodologies', `${methodologyId}.json`);
    fs.writeFileSync(localPath, JSON.stringify(methodology, null, 2));
  }

  /**
   * Get all available methodologies
   */
  getAllMethodologies(): Methodology[] {
    return Array.from(this.localMethodologies.values());
  }

  /**
   * Validate methodology structure
   */
  validateMethodology(methodology: Methodology): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!methodology.id) errors.push('Missing methodology ID');
    if (!methodology.name) errors.push('Missing methodology name');
    if (!methodology.stages || methodology.stages.length === 0) {
      errors.push('Methodology must have at least one stage');
    }

    // Validate stages
    for (const stage of methodology.stages || []) {
      if (!stage.name) errors.push(`Stage missing name`);
      if (!stage.promptTemplate) errors.push(`Stage ${stage.name} missing prompt template`);
      if (!stage.outputs || stage.outputs.length === 0) {
        errors.push(`Stage ${stage.name} must specify outputs`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
