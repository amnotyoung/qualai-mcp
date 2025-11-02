#!/usr/bin/env node

/**
 * QualAI MCP Server
 * AI-Powered Community-Driven Qualitative Research Analysis
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SQLiteAdapter } from './knowledge/storage/sqlite-adapter.js';
import { MethodologyRAG } from './rag/methodology-rag.js';
import { z } from 'zod';

// Initialize core systems
const db = new SQLiteAdapter();
const rag = new MethodologyRAG();

// Create MCP server
const server = new Server(
  {
    name: 'qualai-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool Definitions
 */

// 1. Methodology Selection & Management
const selectMethodologySchema = z.object({
  intent: z.string().describe('What you want to do with your data'),
  dataType: z.string().optional().describe('Type of data (interview, observation, document)'),
  researchGoal: z.enum(['theory_building', 'description', 'exploration', 'evaluation']).optional(),
  sampleSize: z.number().optional().describe('Number of data sources'),
});

const loadMethodologySchema = z.object({
  methodologyId: z.string().describe('ID of the methodology to load'),
});

const listMethodologiesSchema = z.object({
  category: z.string().optional().describe('Filter by category'),
});

// 2. Coding Tools
const autoCodingSchema = z.object({
  text: z.string().describe('Text to analyze and code'),
  existingCodes: z.array(z.string()).optional().describe('Existing codes to consider'),
  methodology: z.string().optional().describe('Methodology to follow'),
});

const refineCodebookSchema = z.object({
  projectName: z.string().describe('Project name'),
});

const mergeCodesSmartSchema = z.object({
  codes: z.array(z.string()).describe('Codes to analyze for potential merging'),
});

// 3. Thematic Analysis Tools
const extractThemesSchema = z.object({
  projectName: z.string().describe('Project name'),
  mode: z.enum(['inductive', 'deductive']).describe('Analysis mode'),
  depth: z.enum(['shallow', 'medium', 'deep']).optional(),
});

const detectSaturationSchema = z.object({
  projectName: z.string().describe('Project name'),
  level: z.enum(['code', 'theme', 'theoretical']).describe('Level to check saturation'),
});

// 4. Validation Tools
const findNegativeCasesSchema = z.object({
  theme: z.string().describe('Theme to find negative cases for'),
  threshold: z.enum(['weak', 'moderate', 'strong']).describe('Contradiction threshold'),
});

const calculateReliabilitySchema = z.object({
  segment: z.string().describe('Text segment coded by multiple coders'),
  coder1Codes: z.array(z.string()).describe('Codes from first coder'),
  coder2Codes: z.array(z.string()).describe('Codes from second coder'),
  measure: z.enum(['cohens_kappa', 'percentage_agreement']).optional(),
});

// 5. Theory Building Tools
const buildGroundedTheorySchema = z.object({
  projectName: z.string().describe('Project name'),
  researchQuestion: z.string().describe('Research question'),
  paradigm: z.enum(['constructivist', 'objectivist']).optional(),
});

const generateConceptMapSchema = z.object({
  projectName: z.string().describe('Project name'),
  focus: z.string().optional().describe('Specific focus area'),
  style: z.enum(['hierarchical', 'network', 'process']).optional(),
});

// 6. Project Management
const createProjectSchema = z.object({
  projectName: z.string().describe('Name of the research project'),
  researchQuestions: z.array(z.string()).optional(),
  methodology: z.string().optional(),
});

const addDataSourceSchema = z.object({
  projectName: z.string().describe('Project name'),
  sourceType: z.enum(['interview', 'observation', 'document']).describe('Type of data source'),
  name: z.string().describe('Name/identifier for the data source'),
  content: z.string().describe('The actual data content'),
  metadata: z.record(z.any()).optional(),
});

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Methodology Management (3 tools)
      {
        name: 'selectMethodology',
        description: 'Find and select the best qualitative research methodology for your needs. The system will search community-contributed methodologies and recommend the most suitable options.',
        inputSchema: {
          type: 'object',
          properties: {
            intent: { type: 'string', description: 'What you want to do with your data' },
            dataType: { type: 'string', description: 'Type of data (interview, observation, document)' },
            researchGoal: { type: 'string', enum: ['theory_building', 'description', 'exploration', 'evaluation'] },
            sampleSize: { type: 'number', description: 'Number of data sources' },
          },
          required: ['intent'],
        },
      },
      {
        name: 'loadMethodology',
        description: 'Load a specific methodology by ID and prepare for analysis',
        inputSchema: {
          type: 'object',
          properties: {
            methodologyId: { type: 'string', description: 'ID of the methodology to load' },
          },
          required: ['methodologyId'],
        },
      },
      {
        name: 'listMethodologies',
        description: 'List all available methodologies, optionally filtered by category',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Filter by category' },
          },
        },
      },

      // Coding Tools (5 tools)
      {
        name: 'autoCoding',
        description: 'AI-powered automatic coding of qualitative data. Analyzes text and suggests appropriate codes based on content and methodology.',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to analyze and code' },
            existingCodes: { type: 'array', items: { type: 'string' }, description: 'Existing codes to consider' },
            methodology: { type: 'string', description: 'Methodology to follow' },
          },
          required: ['text'],
        },
      },
      {
        name: 'refineCodebook',
        description: 'Analyze and refine the codebook: merge duplicates, suggest hierarchy, improve definitions',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'mergeCodesSmart',
        description: 'Intelligently suggest which codes should be merged based on semantic similarity',
        inputSchema: {
          type: 'object',
          properties: {
            codes: { type: 'array', items: { type: 'string' }, description: 'Codes to analyze for potential merging' },
          },
          required: ['codes'],
        },
      },
      {
        name: 'suggestSubcodes',
        description: 'Suggest subcodes for a given code based on coded segments',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Code to suggest subcodes for' },
          },
          required: ['code'],
        },
      },
      {
        name: 'validateCoding',
        description: 'Check coding consistency and identify potential issues',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
          },
          required: ['projectName'],
        },
      },

      // Thematic Analysis Tools (4 tools)
      {
        name: 'extractThemes',
        description: 'Extract themes from coded data using inductive or deductive approach. Identifies patterns, generates theme descriptions, and assesses saturation.',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
            mode: { type: 'string', enum: ['inductive', 'deductive'], description: 'Analysis mode' },
            depth: { type: 'string', enum: ['shallow', 'medium', 'deep'] },
          },
          required: ['projectName', 'mode'],
        },
      },
      {
        name: 'analyzePatterns',
        description: 'Analyze patterns and relationships in coded data',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'detectSaturation',
        description: 'Detect theoretical saturation at code, theme, or theoretical level. Estimates additional samples needed.',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
            level: { type: 'string', enum: ['code', 'theme', 'theoretical'], description: 'Level to check saturation' },
          },
          required: ['projectName', 'level'],
        },
      },
      {
        name: 'compareThemesAcrossCases',
        description: 'Compare how themes manifest across different cases or participant groups',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
            groupBy: { type: 'string', description: 'How to group cases (e.g., "participant", "timepoint")' },
          },
          required: ['projectName'],
        },
      },

      // Theory Building Tools (3 tools)
      {
        name: 'buildGroundedTheory',
        description: 'Guide through grounded theory development: open coding → axial coding → selective coding → theory',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
            researchQuestion: { type: 'string', description: 'Research question' },
            paradigm: { type: 'string', enum: ['constructivist', 'objectivist'] },
          },
          required: ['projectName', 'researchQuestion'],
        },
      },
      {
        name: 'generateConceptMap',
        description: 'Automatically generate concept map showing relationships between codes, themes, and concepts',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
            focus: { type: 'string', description: 'Specific focus area' },
            style: { type: 'string', enum: ['hierarchical', 'network', 'process'] },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'analyzeNarrative',
        description: 'Analyze narrative structure using Labov model or other narrative frameworks',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Narrative text to analyze' },
            participant: { type: 'string', description: 'Participant ID' },
          },
          required: ['text'],
        },
      },

      // Validation Tools (4 tools)
      {
        name: 'findNegativeCases',
        description: 'Find cases that contradict or deviate from established themes. Essential for theoretical rigor.',
        inputSchema: {
          type: 'object',
          properties: {
            theme: { type: 'string', description: 'Theme to find negative cases for' },
            threshold: { type: 'string', enum: ['weak', 'moderate', 'strong'], description: 'Contradiction threshold' },
          },
          required: ['theme'],
        },
      },
      {
        name: 'triangulate',
        description: 'Perform triangulation across multiple data sources or methods',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
            sources: { type: 'array', items: { type: 'string' }, description: 'Data sources to triangulate' },
          },
          required: ['projectName', 'sources'],
        },
      },
      {
        name: 'calculateReliability',
        description: 'Calculate inter-coder reliability (Cohen\'s Kappa, Krippendorff\'s Alpha, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            segment: { type: 'string', description: 'Text segment coded by multiple coders' },
            coder1Codes: { type: 'array', items: { type: 'string' }, description: 'Codes from first coder' },
            coder2Codes: { type: 'array', items: { type: 'string' }, description: 'Codes from second coder' },
            measure: { type: 'string', enum: ['cohens_kappa', 'percentage_agreement'] },
          },
          required: ['segment', 'coder1Codes', 'coder2Codes'],
        },
      },
      {
        name: 'assessQuality',
        description: 'Assess overall research quality based on established criteria (credibility, transferability, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
          },
          required: ['projectName'],
        },
      },

      // Comparison & Reporting Tools (2 tools)
      {
        name: 'compareSegments',
        description: 'Compare multiple text segments for similarities and differences',
        inputSchema: {
          type: 'object',
          properties: {
            segments: { type: 'array', items: { type: 'string' }, description: 'Text segments to compare' },
          },
          required: ['segments'],
        },
      },
      {
        name: 'generateReport',
        description: 'Generate comprehensive analysis report with themes, quotes, statistics, and visualizations',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
            sections: { type: 'array', items: { type: 'string' }, description: 'Report sections to include' },
          },
          required: ['projectName'],
        },
      },

      // Project Management Tools (2 tools)
      {
        name: 'createProject',
        description: 'Create a new qualitative research project',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Name of the research project' },
            researchQuestions: { type: 'array', items: { type: 'string' } },
            methodology: { type: 'string' },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'addDataSource',
        description: 'Add a new data source (interview, observation, document) to the project',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'Project name' },
            sourceType: { type: 'string', enum: ['interview', 'observation', 'document'] },
            name: { type: 'string', description: 'Name/identifier for the data source' },
            content: { type: 'string', description: 'The actual data content' },
            metadata: { type: 'object' },
          },
          required: ['projectName', 'sourceType', 'name', 'content'],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Methodology Management
      case 'selectMethodology': {
        const parsed = selectMethodologySchema.parse(args);
        const results = await rag.findMethodology(parsed);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              message: `Found ${results.length} suitable methodologies`,
              methodologies: results.map(r => ({
                id: r.methodology.id,
                name: r.methodology.name,
                score: r.score,
                fitScore: r.fitScore,
                reasoning: r.reasoning,
                description: r.methodology.description,
                category: r.methodology.category,
                citations: r.methodology.metadata.citations,
              })),
              recommendation: results[0]?.methodology.id,
            }, null, 2),
          }],
        };
      }

      case 'loadMethodology': {
        const parsed = loadMethodologySchema.parse(args);
        const methodology = await rag.getMethodology(parsed.methodologyId);

        if (!methodology) {
          throw new Error(`Methodology ${parsed.methodologyId} not found`);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              message: `Loaded ${methodology.name}`,
              methodology: {
                id: methodology.id,
                name: methodology.name,
                description: methodology.description,
                stages: methodology.stages.map(s => ({
                  name: s.name,
                  description: s.description,
                  order: s.order,
                })),
                tools: methodology.tools,
                qualityCriteria: methodology.qualityCriteria,
              },
            }, null, 2),
          }],
        };
      }

      case 'listMethodologies': {
        const parsed = listMethodologiesSchema.parse(args);
        let methodologies = rag.getAllMethodologies();

        if (parsed.category) {
          methodologies = methodologies.filter(m => m.category === parsed.category);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total: methodologies.length,
              methodologies: methodologies.map(m => ({
                id: m.id,
                name: m.name,
                category: m.category,
                author: m.author,
                citations: m.metadata.citations,
                rating: m.metadata.rating,
              })),
            }, null, 2),
          }],
        };
      }

      // Project Management
      case 'createProject': {
        const parsed = createProjectSchema.parse(args);

        db.createEntity({
          name: parsed.projectName,
          entityType: 'project',
          observations: [
            `Research Questions: ${parsed.researchQuestions?.join('; ') || 'Not specified'}`,
            `Methodology: ${parsed.methodology || 'Not specified'}`,
            `Created: ${new Date().toISOString()}`,
          ],
          metadata: {
            researchQuestions: parsed.researchQuestions,
            methodology: parsed.methodology,
          },
        });

        return {
          content: [{
            type: 'text',
            text: `✅ Created project "${parsed.projectName}"\n\nYou can now add data sources using the addDataSource tool.`,
          }],
        };
      }

      case 'addDataSource': {
        const parsed = addDataSourceSchema.parse(args);

        const sourceName = `${parsed.projectName}__${parsed.sourceType}__${parsed.name}`;

        db.createEntity({
          name: sourceName,
          entityType: parsed.sourceType,
          observations: [
            `Content length: ${parsed.content.length} characters`,
            `Added: ${new Date().toISOString()}`,
          ],
          metadata: {
            content: parsed.content,
            ...parsed.metadata,
          },
        });

        db.createRelation({
          from: sourceName,
          to: parsed.projectName,
          relationType: 'part_of',
        });

        return {
          content: [{
            type: 'text',
            text: `✅ Added ${parsed.sourceType} "${parsed.name}" to project "${parsed.projectName}"\n\nContent length: ${parsed.content.length} characters`,
          }],
        };
      }

      // Coding Tools (placeholder implementations)
      case 'autoCoding': {
        const parsed = autoCodingSchema.parse(args);

        return {
          content: [{
            type: 'text',
            text: `🔄 Auto-coding analysis for ${parsed.text.length} characters...\n\nThis feature will analyze your text and suggest codes based on:\n- Content semantics\n- Existing codes: ${parsed.existingCodes?.join(', ') || 'none'}\n- Methodology: ${parsed.methodology || 'general'}\n\n[Full implementation in progress]`,
          }],
        };
      }

      // Default handler for other tools
      default:
        return {
          content: [{
            type: 'text',
            text: `Tool "${name}" is registered but implementation is in progress.\n\nThis is part of the QualAI MCP server - a comprehensive qualitative research analysis system.\n\nFull implementation coming soon!`,
          }],
        };
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
});

/**
 * Start server
 */
async function main() {
  console.error('🚀 QualAI MCP Server starting...');

  // Sync methodologies from GitHub (if configured)
  const githubRepo = process.env.QUALAI_GITHUB_REPO;
  if (githubRepo) {
    console.error(`📥 Syncing methodologies from ${githubRepo}...`);
    const synced = await rag.syncFromGitHub(githubRepo);
    console.error(`✅ Synced ${synced} methodologies`);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('✅ QualAI MCP Server ready!');
  console.error('📚 Available tools: 20');
  console.error('🧠 Methodologies loaded:', rag.getAllMethodologies().length);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
