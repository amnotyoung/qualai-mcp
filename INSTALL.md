# 🚀 QualAI Installation Guide

## ✅ Installation Complete!

Your QualAI MCP server has been successfully built and is ready to use.

---

## 📍 Next Steps: Configure Claude Desktop

### Step 1: Open Claude Desktop Configuration

The config file is located at:
```
C:\Users\sshin\AppData\Roaming\Claude\claude_desktop_config.json
```

### Step 2: Add QualAI to the config

Add this section to `mcpServers` (after the last server, before the closing `}`):

```json
    "qualai": {
      "command": "node",
      "args": ["C:\\Users\\sshin\\Documents\\qualai-mcp\\dist\\index.js"]
    }
```

**Full example** (add the comma after the previous server):
```json
{
  "permissions": {
    "mode": "ask"
  },
  "mcpServers": {
    "your-other-server": {
      ...
    },
    "qualai": {
      "command": "node",
      "args": ["C:\\Users\\sshin\\Documents\\qualai-mcp\\dist\\index.js"]
    }
  }
}
```

### Step 3: Restart Claude Desktop

1. Completely quit Claude Desktop
2. Reopen Claude Desktop
3. Start a new conversation

---

## ✨ Verify Installation

In a new Claude conversation, ask:

```
Do you have access to QualAI tools?
```

Claude should respond with information about the 20 available qualitative research tools!

---

## 🎯 Quick Test

Try this example:

```
I'm doing qualitative research on healthcare experiences.
I have 10 interview transcripts. What methodology should I use?
```

Claude will use the `selectMethodology` tool to recommend appropriate research methodologies!

---

## 📚 Available Tools (20 total)

### Methodology Management
- `selectMethodology` - Find best methodology for your research
- `loadMethodology` - Load specific methodology
- `listMethodologies` - Browse all methodologies

### Coding Tools
- `autoCoding` - AI-powered automatic coding
- `refineCodebook` - Optimize codebook
- `mergeCodesSmart` - Intelligent code merging
- `suggestSubcodes` - Hierarchical code suggestions
- `validateCoding` - Consistency checking

### Thematic Analysis
- `extractThemes` - Extract themes (inductive/deductive)
- `analyzePatterns` - Pattern analysis
- `detectSaturation` - Saturation detection
- `compareThemesAcrossCases` - Cross-case comparison

### Theory Building
- `buildGroundedTheory` - Grounded theory development
- `generateConceptMap` - Concept mapping
- `analyzeNarrative` - Narrative structure analysis

### Validation
- `findNegativeCases` - Negative case analysis
- `triangulate` - Triangulation
- `calculateReliability` - Inter-coder reliability
- `assessQuality` - Quality assessment

### Project Management
- `createProject` - Create research project
- `addDataSource` - Add interview/observation data

### Reporting
- `generateReport` - Comprehensive reports

---

## 🔧 Optional: Advanced Configuration

### Add OpenAI API Key (for better semantic search)

```json
"qualai": {
  "command": "node",
  "args": ["C:\\Users\\sshin\\Documents\\qualai-mcp\\dist\\index.js"],
  "env": {
    "OPENAI_API_KEY": "sk-your-key-here"
  }
}
```

### Connect to GitHub Methodology Repository

```json
"qualai": {
  "command": "node",
  "args": ["C:\\Users\\sshin\\Documents\\qualai-mcp\\dist\\index.js"],
  "env": {
    "QUALAI_GITHUB_REPO": "your-org/qualai-methodologies",
    "GITHUB_TOKEN": "ghp_your-token"
  }
}
```

---

## 📖 Included Methodologies

QualAI comes with 2 research methodologies out of the box:

1. **Constructivist Grounded Theory** (Charmaz)
   - Theory-building from data
   - Process-oriented
   - 4 stages: Initial → Focused → Theoretical coding + Memos

2. **Reflexive Thematic Analysis** (Braun & Clarke)
   - Pattern identification
   - Flexible approach
   - 6-phase process

---

## 🆘 Troubleshooting

### Server won't start
```bash
# Rebuild the project
cd C:\Users\sshin\Documents\qualai-mcp
npm run build
```

### Tools not showing in Claude
1. Check config file syntax (valid JSON)
2. Restart Claude Desktop completely
3. Check for errors in Claude's logs

### Need to update
```bash
cd C:\Users\sshin\Documents\qualai-mcp
git pull
npm install
npm run build
# Then restart Claude Desktop
```

---

## 🎓 Next Steps

1. Read the [README](./README.md) for full documentation
2. Try the example workflows
3. Explore community methodologies
4. Contribute your own methodology!

---

## 🌟 What Makes QualAI Special?

### Traditional Qualitative Software (NVivo, MAXQDA)
- ❌ Expensive ($$$)
- ❌ Click-heavy interface
- ❌ Steep learning curve
- ❌ No AI assistance
- ❌ Closed ecosystem

### QualAI
- ✅ **Free & Open Source**
- ✅ **Conversational Interface** - Just talk to Claude
- ✅ **AI-Powered** - Auto-coding, theme extraction, saturation detection
- ✅ **Community-Driven** - Share methodologies via GitHub
- ✅ **Methodologically Rigorous** - Based on established qualitative methods
- ✅ **RAG-Enhanced** - Access community knowledge base

---

## 💡 Example Research Workflow

```
1. You: "Create a project called 'Healthcare Study'"
   → Creates project

2. You: "Add this interview transcript: [paste]"
   → Adds data to project

3. You: "What methodology should I use for theory-building?"
   → Recommends Grounded Theory

4. You: "Load Grounded Theory methodology"
   → Loads methodology with stages

5. You: "Do initial coding on my interview"
   → AI generates line-by-line codes

6. You: "Extract themes from codes"
   → Identifies emergent themes

7. You: "Check saturation"
   → Analyzes if more data needed

8. You: "Generate analysis report"
   → Produces comprehensive report
```

All through natural conversation! 🎉

---

## 📞 Support

- **GitHub Issues**: Report bugs or request features
- **Documentation**: See README.md
- **Community**: Join discussions

---

**You're all set! Start your qualitative research journey with AI! 🚀**
