/**
 * Core entity types for qualitative research
 */

export interface Entity {
  name: string;
  entityType: EntityType;
  observations: string[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export type EntityType =
  | 'project'
  | 'participant'
  | 'interview'
  | 'observation'
  | 'document'
  | 'code'
  | 'codeGroup'
  | 'memo'
  | 'theme'
  | 'quote'
  | 'literature'
  | 'researchQuestion'
  | 'finding'
  | 'concept'
  | 'category';

export interface Relation {
  from: string;
  to: string;
  relationType: RelationType;
  metadata?: Record<string, any>;
}

export type RelationType =
  | 'participated_in'
  | 'codes'
  | 'contains'
  | 'supports'
  | 'contradicts'
  | 'answers'
  | 'cites'
  | 'followed_by'
  | 'related_to'
  | 'reflects_on'
  | 'compares'
  | 'part_of'
  | 'derived_from'
  | 'analyzes'
  | 'triangulates_with'
  | 'causes'
  | 'influences';

export interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
  metadata?: {
    projectName?: string;
    methodology?: string;
    version?: string;
    lastModified?: string;
  };
}

export interface Code extends Entity {
  entityType: 'code';
  definition?: string;
  examples?: string[];
  inclusionCriteria?: string[];
  exclusionCriteria?: string[];
  frequency?: number;
  coOccurrences?: Map<string, number>;
}

export interface Theme extends Entity {
  entityType: 'theme';
  description?: string;
  supportingCodes?: string[];
  prevalence?: string;
  saturationStatus?: 'saturated' | 'partial' | 'unsaturated';
}

export interface Memo extends Entity {
  entityType: 'memo';
  memoType: 'methodological' | 'theoretical' | 'analytical' | 'reflective';
  content: string;
  linkedEntities?: string[];
}

export interface Quote extends Entity {
  entityType: 'quote';
  text: string;
  source: string;
  startPosition?: number;
  endPosition?: number;
  speaker?: string;
}

export interface Interview extends Entity {
  entityType: 'interview';
  transcript?: string;
  participant?: string;
  date?: string;
  duration?: number;
  location?: string;
  audioFile?: string;
}

export interface ResearchProject extends Entity {
  entityType: 'project';
  researchQuestions?: string[];
  methodology?: string;
  paradigm?: 'positivist' | 'constructivist' | 'critical' | 'pragmatic';
  participants?: number;
  dataCollectionMethods?: string[];
  analysisStage?: 'data_collection' | 'initial_coding' | 'focused_coding' | 'theoretical_coding' | 'writing';
}
