# 🔧 QualAI Technical Specification

Comprehensive technical documentation for QualAI MCP Server.

**Version**: 1.0.0
**Last Updated**: 2025-11-02
**Protocol**: Model Context Protocol (MCP) v1.7.0

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Technology Stack](#technology-stack)
4. [Data Flow](#data-flow)
5. [API Specification](#api-specification)
6. [Storage Systems](#storage-systems)
7. [Performance](#performance)
8. [Security](#security)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Desktop                        │
│                  (MCP Client)                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ MCP Protocol (JSON-RPC over stdio)
                       │
┌──────────────────────▼──────────────────────────────────┐
│              QualAI MCP Server (Node.js)                │
│  ┌────────────────────────────────────────────────────┐ │
│  │            Core Engine (index.ts)                  │ │
│  │  - Tool Request Handler                            │ │
│  │  - 20 MCP Tools Registration                      │ │
│  │  - Protocol Implementation                         │ │
│  └────────┬───────────────────────────────────────────┘ │
│           │                                              │
│  ┌────────▼───────────────────────────────────────────┐ │
│  │      Methodology RAG System (methodology-rag.ts)   │ │
│  │  - Semantic Search (Qdrant + OpenAI Embeddings)   │ │
│  │  - Local Methodology Storage                       │ │
│  │  - GitHub Sync Engine                              │ │
│  │  - Methodology Validation                          │ │
│  └────────┬───────────────────────────────────────────┘ │
│           │                                              │
│  ┌────────▼───────────────────────────────────────────┐ │
│  │   Knowledge Graph (sqlite-adapter.ts)              │ │
│  │  - Entity Management                               │ │
│  │  - Relation Tracking                               │ │
│  │  - Full-Text Search                                │ │
│  │  - Project/Code/Theme Storage                      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
            │                           │
    ┌───────┴──────┐           ┌────────┴──────┐
    │              │           │                │
┌───▼──────┐  ┌───▼────┐  ┌──▼──────┐  ┌─────▼──────┐
│  SQLite  │  │ Qdrant │  │ OpenAI  │  │  GitHub    │
│   DB     │  │ Vector │  │   API   │  │   Repo     │
│          │  │   DB   │  │Embedding│  │ (Optional) │
└──────────┘  └────────┘  └─────────┘  └────────────┘
```

---

## 🧩 Core Components

### 1. MCP Server Core (`src/index.ts`)

**Responsibilities**:
- Implement MCP protocol (JSON-RPC over stdio)
- Register and expose 20 qualitative research tools
- Route requests to appropriate handlers
- Manage server lifecycle

**Key Features**:
- **Protocol Compliance**: MCP SDK v1.7.0
- **Tool Registration**: Dynamic tool definition with Zod schemas
- **Error Handling**: Graceful degradation and error reporting
- **Logging**: stderr-only logging to avoid stdout pollution

**Code Structure**:
```typescript
// Tool schemas (Zod validation)
const selectMethodologySchema = z.object({
  intent: z.string(),
  dataType: z.string().optional(),
  // ...
});

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'selectMethodology':
      return await handleSelectMethodology(args);
    case 'autoCoding':
      return await handleAutoCoding(args);
    // ... 18 more tools
  }
});
```

### 2. Methodology RAG System (`src/rag/methodology-rag.ts`)

**Purpose**: AI-powered methodology discovery and recommendation

**Features**:
- **Semantic Search**: Qdrant vector database with cosine similarity
- **Embedding Generation**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Local Storage**: JSON files in `methodologies/` directory
- **GitHub Integration**: Sync community methodologies via Octokit
- **Fallback Mode**: Works without Qdrant/OpenAI (local search only)

**Search Algorithm**:
```typescript
async findMethodology(query: MethodologySearchQuery): Promise<MethodologySearchResult[]> {
  // 1. Generate query embedding
  const queryEmbedding = await this.generateEmbedding(query.description);

  // 2. Search vector database (if available)
  if (this.qdrantClient) {
    const results = await this.qdrantClient.search('methodologies', {
      vector: queryEmbedding,
      limit: 5,
      score_threshold: 0.7
    });
    return results.map(r => ({
      methodology: this.localMethodologies.get(r.id),
      score: r.score,
      reasoning: generateReasoning(query, r)
    }));
  }

  // 3. Fallback: keyword search on local methodologies
  return this.localSearch(query);
}
```

**Methodology Structure**:
```typescript
interface Methodology {
  id: string;
  name: string;
  version: string;
  author: string;
  category: MethodologyCategory;
  stages: MethodologyStage[];
  tools: {
    coding?: CodeingGuidance;
    thematic?: ThematicGuidance;
    validation?: ValidationGuidance;
  };
  qualityCriteria: {
    credibility: string[];
    transferability: string[];
    dependability: string[];
    confirmability: string[];
  };
  citations: Citation[];
}
```

### 3. Knowledge Graph (`src/knowledge/storage/sqlite-adapter.ts`)

**Purpose**: Persistent storage for research projects, data, codes, and themes

**Database Schema**:

```sql
-- Entities table
CREATE TABLE entities (
  name TEXT PRIMARY KEY,
  entityType TEXT NOT NULL,
  observations TEXT NOT NULL,  -- JSON array
  metadata TEXT                -- JSON object
);

-- Relations table
CREATE TABLE relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fromEntity TEXT NOT NULL,
  toEntity TEXT NOT NULL,
  relationType TEXT NOT NULL,
  FOREIGN KEY (fromEntity) REFERENCES entities(name),
  FOREIGN KEY (toEntity) REFERENCES entities(name)
);

-- Full-text search index
CREATE VIRTUAL TABLE entities_fts USING fts5(
  name,
  entityType,
  observations,
  content=entities
);
```

**Entity Types**:
- `project` - Research project
- `participant` - Study participant
- `interview` - Interview transcript
- `observation` - Field observation
- `document` - Documentary data
- `code` - Coding label
- `codeGroup` - Code category
- `memo` - Analytical memo
- `theme` - Emergent theme
- `quote` - Significant quote
- `literature` - Literature reference
- `researchQuestion` - Research question
- `finding` - Research finding
- `concept` - Theoretical concept
- `category` - Analytical category

**Operations**:
```typescript
class SQLiteAdapter {
  createEntity(entity: Entity): void;
  getEntity(name: string): Entity | null;
  updateEntity(name: string, updates: Partial<Entity>): void;
  deleteEntity(name: string): void;

  createRelation(relation: Relation): void;
  getRelations(entityName: string): Relation[];
  deleteRelation(id: number): void;

  getFullGraph(): KnowledgeGraph;
  searchEntities(query: string): Entity[];
}
```

---

## 💻 Technology Stack

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript execution |
| **Language** | TypeScript | 5.0 | Type-safe development |
| **Protocol** | MCP SDK | 1.7.0 | Model Context Protocol |
| **Database** | SQLite | better-sqlite3 | Knowledge graph storage |
| **Vector DB** | Qdrant | @qdrant/js-client-rest | Semantic search (optional) |
| **Embeddings** | OpenAI | openai | Text embeddings (optional) |
| **GitHub API** | Octokit | @octokit/rest | Community sync (optional) |

### Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.7.0",
    "@octokit/rest": "^20.0.0",
    "@qdrant/js-client-rest": "^1.7.0",
    "better-sqlite3": "^9.2.0",
    "openai": "^4.20.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
```

---

## 🔄 Data Flow

### 1. Tool Invocation Flow

```
Claude Desktop
    │
    ├─> MCP Request (JSON-RPC)
    │   {
    │     "method": "tools/call",
    │     "params": {
    │       "name": "autoCoding",
    │       "arguments": {
    │         "text": "Interview transcript...",
    │         "methodology": "grounded-theory-charmaz"
    │       }
    │     }
    │   }
    │
    ▼
QualAI Server
    │
    ├─> Parse & Validate (Zod schema)
    │
    ├─> Load Methodology (RAG system)
    │   │
    │   ├─> Check local cache
    │   └─> OR semantic search (Qdrant)
    │
    ├─> Execute Tool Logic
    │   │
    │   ├─> Apply methodology guidance
    │   ├─> Generate codes using Claude
    │   └─> Store in Knowledge Graph (SQLite)
    │
    ├─> Format Response
    │   {
    │     "content": [{
    │       "type": "text",
    │       "text": "Generated 15 codes: [...]"
    │     }]
    │   }
    │
    ▼
Claude Desktop
```

### 2. Methodology Sync Flow

```
User Request
    │
    ▼
syncFromGitHub()
    │
    ├─> Fetch methodology files from GitHub
    │   (via Octokit API)
    │
    ├─> Validate each methodology
    │   │
    │   ├─> Check required fields
    │   ├─> Verify stage structure
    │   └─> Validate citations
    │
    ├─> Generate embeddings
    │   │
    │   ├─> Combine: name + description + stages
    │   └─> OpenAI text-embedding-3-small
    │
    ├─> Store in Qdrant
    │   (if available)
    │
    └─> Save to local JSON files
        (methodologies/*.json)
```

---

## 📡 API Specification

### Tool Categories and Endpoints

#### 1. Methodology Management (3 tools)

**selectMethodology**
- **Purpose**: AI-powered methodology recommendation
- **Input**: Research intent, data type, research goal
- **Output**: Ranked list of suitable methodologies with reasoning
- **Algorithm**: RAG semantic search + heuristic matching

**loadMethodology**
- **Purpose**: Load full methodology details
- **Input**: Methodology ID
- **Output**: Complete methodology structure with stages and guidance

**listMethodologies**
- **Purpose**: Browse available methodologies
- **Input**: Optional category filter
- **Output**: List of methodologies with metadata

#### 2. Coding Tools (5 tools)

**autoCoding**
- **Purpose**: Automatic code generation from text
- **Input**: Text segment, existing codes (optional), methodology
- **Output**: Generated codes with definitions and examples
- **Process**:
  1. Load methodology guidance
  2. Apply coding principles from methodology
  3. Generate codes using Claude with structured prompt
  4. Store codes in Knowledge Graph

**refineCodebook**
- **Purpose**: Optimize and consolidate codebook
- **Input**: Project name
- **Output**: Refined codebook with merged/split codes
- **Operations**:
  - Remove redundant codes
  - Merge similar codes
  - Split overly broad codes
  - Add hierarchy

**mergeCodesSmart**
- **Purpose**: Intelligent code merging
- **Input**: List of codes to analyze
- **Output**: Merge recommendations with rationale

**suggestSubcodes**
- **Purpose**: Generate hierarchical subcodes
- **Input**: Parent code
- **Output**: Suggested subcodes with examples

**validateCoding**
- **Purpose**: Check coding consistency
- **Input**: Project name
- **Output**: Validation report with inconsistencies

#### 3. Thematic Analysis (4 tools)

**extractThemes**
- **Purpose**: Extract themes from coded data
- **Input**: Project name, mode (inductive/deductive), depth
- **Output**: Themes with supporting codes and quotes
- **Modes**:
  - **Inductive**: Bottom-up theme generation from codes
  - **Deductive**: Top-down theme verification against framework

**analyzePatterns**
- **Purpose**: Identify patterns and relationships
- **Input**: Project name
- **Output**: Pattern map with relationships

**detectSaturation**
- **Purpose**: Assess theoretical saturation
- **Input**: Project name, level (code/theme/theoretical)
- **Output**: Saturation assessment with recommendations

**compareThemesAcrossCases**
- **Purpose**: Cross-case thematic comparison
- **Input**: Project name
- **Output**: Theme matrix across cases

#### 4. Theory Building (3 tools)

**buildGroundedTheory**
- **Purpose**: Guided grounded theory development
- **Input**: Project name, research question, paradigm
- **Output**: Theoretical model with categories and properties

**generateConceptMap**
- **Purpose**: Automatic concept mapping
- **Input**: Project name
- **Output**: Concept map visualization data

**analyzeNarrative**
- **Purpose**: Narrative structure analysis
- **Input**: Interview/document
- **Output**: Narrative elements and structure

#### 5. Validation (4 tools)

**findNegativeCases**
- **Purpose**: Identify disconfirming evidence
- **Input**: Theme, contradiction threshold
- **Output**: Negative cases with analysis

**triangulate**
- **Purpose**: Multi-source triangulation
- **Input**: Multiple data sources
- **Output**: Triangulation matrix

**calculateReliability**
- **Purpose**: Inter-coder reliability calculation
- **Input**: Text segment, coder1 codes, coder2 codes, measure
- **Output**: Cohen's Kappa or percentage agreement
- **Formulas**:
  ```
  Cohen's Kappa: κ = (Po - Pe) / (1 - Pe)
  Po = observed agreement
  Pe = expected agreement by chance
  ```

**assessQuality**
- **Purpose**: Research quality assessment
- **Input**: Project name
- **Output**: Quality report against criteria (credibility, transferability, etc.)

---

## 💾 Storage Systems

### 1. SQLite Database

**Location**: `~/.qualai/knowledge.sqlite` (cross-platform)

**Size**: Typically 10-100 MB for 100 projects

**Indexes**:
- Primary key: `entities.name`
- Foreign keys: `relations.fromEntity`, `relations.toEntity`
- Full-text search: `entities_fts`

**Backup**:
- Automatic WAL (Write-Ahead Logging)
- Manual backup via `VACUUM INTO`

### 2. Qdrant Vector Database (Optional)

**Configuration**:
```typescript
{
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  collectionName: 'methodologies',
  vectorSize: 1536,
  distance: 'Cosine'
}
```

**Fallback**: If Qdrant unavailable, local keyword search used

### 3. Local File Storage

**Methodologies**: `./methodologies/*.json`

**Structure**:
```
methodologies/
├── grounded-theory-charmaz.json
├── thematic-analysis-braun-clarke.json
└── [community-contributed].json
```

---

## ⚡ Performance

### Benchmarks

| Operation | Average Time | Notes |
|-----------|-------------|-------|
| Tool invocation | 50-200ms | Depends on Claude response |
| Methodology search (local) | 5-10ms | Keyword search |
| Methodology search (RAG) | 100-300ms | Includes embedding generation |
| Auto-coding (1 page) | 2-5s | Depends on Claude processing |
| Knowledge graph query | 1-5ms | SQLite indexed lookup |
| Full-text search | 10-50ms | FTS5 virtual table |

### Optimization Strategies

1. **Lazy Loading**: Methodologies loaded on demand
2. **Caching**: Local methodology cache in memory
3. **Batch Operations**: Multiple entities inserted in single transaction
4. **Index Optimization**: FTS5 for fast text search
5. **Fallback Modes**: Graceful degradation when optional services unavailable

---

## 🔒 Security

### Data Privacy

- **Local-First**: All research data stored locally in SQLite
- **No Cloud Storage**: Knowledge graph never transmitted
- **Optional Services**: Qdrant/OpenAI/GitHub are optional
- **API Keys**: User-provided, not collected

### Authentication

- **GitHub**: OAuth tokens for private repo access (optional)
- **OpenAI**: User API key for embeddings (optional)
- **Qdrant**: Local instance or self-hosted (optional)

### Data Protection

- **No Telemetry**: No usage data collected
- **No Logging**: Only stderr logging for debugging
- **Sandboxed**: MCP protocol isolation from Claude Desktop

---

## 📊 System Requirements

### Minimum

- **OS**: Windows 10, macOS 11, Ubuntu 20.04
- **CPU**: Dual-core 2.0 GHz
- **RAM**: 2 GB available
- **Disk**: 500 MB free space
- **Node.js**: 18.0+

### Recommended

- **OS**: Windows 11, macOS 13, Ubuntu 22.04
- **CPU**: Quad-core 2.5 GHz
- **RAM**: 4 GB available
- **Disk**: 2 GB free space (for large projects)
- **Node.js**: 20.0+

---

## 🔧 Development

### Build Process

```bash
# Install dependencies
npm install

# TypeScript compilation
npm run build

# Watch mode (development)
npm run dev

# Type checking only
npm run type-check
```

### Testing

```bash
# Run MCP server directly (for testing)
node dist/index.js

# Test with MCP Inspector
npx @modelcontextprotocol/inspector dist/index.js
```

### Debugging

**Enable verbose logging**:
```bash
# All logs go to stderr
NODE_ENV=development node dist/index.js 2> debug.log
```

---

## 📝 Changelog

### v1.0.0 (2025-11-02)

**Initial Release**
- ✅ 20 qualitative research tools
- ✅ RAG-based methodology system
- ✅ SQLite knowledge graph
- ✅ 2 default methodologies (Grounded Theory, Thematic Analysis)
- ✅ GitHub community integration
- ✅ MCP 1.7.0 compliance

---

## 🔮 Roadmap

### v1.1.0 (Planned)

- [ ] Phenomenology methodology
- [ ] Advanced visualization tools
- [ ] Export to MAXQDA/NVivo formats
- [ ] Korean language optimization

### v2.0.0 (Future)

- [ ] Real-time collaboration
- [ ] Video/audio coding support
- [ ] Multi-language support
- [ ] Web interface

---

## 📚 References

### Standards & Protocols

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [JSON-RPC 2.0](https://www.jsonrpc.org/specification)

### Methodologies

- Charmaz, K. (2014). *Constructing Grounded Theory* (2nd ed.)
- Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology
- Glaser, B. G., & Strauss, A. L. (1967). *The Discovery of Grounded Theory*

### Technical

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [SQLite FTS5](https://www.sqlite.org/fts5.html)
- [Qdrant Vector Search](https://qdrant.tech/documentation/)

---

**Version**: 1.0.0
**Last Updated**: 2025-11-02
**Maintainer**: @seanshin0214
