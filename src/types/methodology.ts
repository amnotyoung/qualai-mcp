/**
 * Methodology definition types for community-contributed research methods
 */

export interface Methodology {
  id: string;
  name: string;
  version: string;
  author: string;
  category: MethodologyCategory;
  description: string;

  // Core methodology structure
  stages: MethodologyStage[];
  tools: MethodologyTools;
  qualityCriteria: QualityCriteria;

  // Community metadata
  metadata: {
    citations: number;
    usageCount: number;
    rating: number;
    tags: string[];
    license: string;
    repository?: string;
    doi?: string;
    references?: string[];
  };

  // Validation
  validated: boolean;
  reviewers?: string[];

  // Examples
  examples?: MethodologyExample[];
}

export type MethodologyCategory =
  | 'theory-building'
  | 'descriptive'
  | 'interpretive'
  | 'critical'
  | 'mixed'
  | 'custom';

export interface MethodologyStage {
  name: string;
  description: string;
  order: number;

  // Prompts for this stage
  promptTemplate: string;
  systemPrompt?: string;

  // Requirements
  requires?: string[]; // Previous stages needed
  inputs?: string[]; // What data is needed
  outputs: string[]; // What this stage produces

  // Validation
  validationRules?: ValidationRule[];
  minimumSampleSize?: number;

  // Configuration
  parameters?: Record<string, any>;
  optional?: boolean;
}

export interface ValidationRule {
  type: 'minimum_codes' | 'diversity_check' | 'saturation_check' | 'consistency' | 'custom';
  threshold?: number;
  description: string;
  autoFix?: boolean;
}

export interface MethodologyTools {
  coding?: string[]; // Which coding tools to use
  analysis?: string[]; // Which analysis tools
  validation?: string[]; // Which validation tools
  reporting?: string[]; // Which reporting tools
}

export interface QualityCriteria {
  credibility?: string[];
  transferability?: string[];
  dependability?: string[];
  confirmability?: string[];
  authenticity?: string[];
  custom?: Record<string, string[]>;
}

export interface MethodologyExample {
  title: string;
  description: string;
  dataType: 'interview' | 'observation' | 'document' | 'mixed';
  sampleData?: string;
  expectedCodes?: Code[];
  expectedThemes?: Theme[];
  notes?: string;
}

export interface MethodologyPrompt {
  template: string;
  variables: string[];
  examples?: Array<{
    input: Record<string, any>;
    output: string;
  }>;
}

// RAG-specific types
export interface MethodologyDocument {
  id: string;
  methodology: string;
  stage?: string;
  content: string;
  embedding?: number[];
  metadata: {
    author: string;
    version: string;
    category: MethodologyCategory;
    citations: number;
    validated: boolean;
    tags: string[];
  };
}

export interface MethodologySearchQuery {
  intent: string;
  dataType?: string;
  researchGoal?: 'theory_building' | 'description' | 'exploration' | 'evaluation';
  expertise?: 'beginner' | 'intermediate' | 'advanced';
  paradigm?: 'positivist' | 'constructivist' | 'critical' | 'pragmatic';
  sampleSize?: number;
}

export interface MethodologySearchResult {
  methodology: Methodology;
  score: number;
  fitScore: number;
  reasoning: string;
}

// Analysis types
export interface Code {
  label: string;
  definition: string;
  segment: string;
  type: 'in_vivo' | 'constructed' | 'theoretical';
  memo?: string;
  properties?: Record<string, any>;
}

export interface Theme {
  name: string;
  description: string;
  supportingCodes: string[];
  supportingQuotes: string[];
  prevalence: string;
  saturationStatus: 'saturated' | 'partial' | 'unsaturated';
  subthemes?: string[];
}

export interface CodingSuggestion {
  text: string;
  suggestedCodes: string[];
  confidence: number;
  reasoning: string;
  startPos: number;
  endPos: number;
  type: 'auto' | 'semi-auto' | 'manual';
}

export interface ThematicAnalysisResult {
  emergentThemes: Theme[];
  hiddenPatterns: string[];
  recommendations: string[];
  saturationLevel: number;
  theoreticalSignificance?: string;
}

export interface GroundedTheoryResult {
  coreCategory: string;
  storyline: string;
  paradigmModel?: {
    causalConditions: string[];
    phenomenon: string;
    context: string[];
    interveningConditions: string[];
    actionStrategies: string[];
    consequences: string[];
  };
  theoreticalSaturation: number;
  literatureConnections?: string[];
}

export interface NegativeCase {
  caseId: string;
  theme: string;
  contradictionType: 'strong' | 'moderate' | 'weak';
  differentiatingFactors: string[];
  theoreticalImplication: string;
  followUpActions: string[];
}

export interface SaturationAnalysis {
  level: 'code' | 'theme' | 'theoretical';
  saturatedElements: Array<{
    name: string;
    saturatedAt: number; // Interview number
    confidence: number;
  }>;
  unsaturatedElements: Array<{
    name: string;
    status: string;
    recommendation: string;
  }>;
  overallSaturation: number;
  estimatedAdditionalSamples: number;
}

export interface IntercoderReliability {
  measure: 'cohens_kappa' | 'krippendorffs_alpha' | 'percentage_agreement';
  value: number;
  interpretation: string;
  disagreements: Array<{
    segment: string;
    coder1: string;
    coder2: string;
    aiSuggestion?: string;
    reasoning: string;
  }>;
  consensusRecommendations: string[];
}

export interface ConceptMap {
  format: 'mermaid' | 'json' | 'graphml';
  content: string;
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    quotes?: string[];
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: string;
    weight?: number;
  }>;
  interpretation: string;
  theoreticalImplications?: string[];
}
