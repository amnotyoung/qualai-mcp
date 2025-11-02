# 🔬 QualAI - AI-Powered Qualitative Research MCP Server

> **Community-driven, RAG-enhanced qualitative research analysis powered by Claude**

Transform qualitative research with AI assistance. QualAI is a Model Context Protocol (MCP) server that brings advanced AI capabilities to qualitative data analysis while maintaining methodological rigor.

---

## 💡 Share Your Innovative Research Methods!

**QualAI grows stronger with every researcher who contributes.**

Have you developed a unique qualitative methodology? A novel coding technique? An innovative analysis approach?

**🌟 Share it with the global research community!**

When you contribute your methodology to QualAI:
- ✅ **Help thousands of researchers** worldwide discover and use your approach
- ✅ **Get cited** every time someone uses your methodology
- ✅ **Receive feedback** and improvements from peer researchers
- ✅ **Build your reputation** as a methodological innovator
- ✅ **Make qualitative research better** for everyone

**Your innovation can transform how the world does qualitative research.**

👉 [**Contribute Your Methodology**](#contributing-your-methodology) | [**Browse Community Methods**](https://github.com/qualai-community/methodologies)

---

## ✨ Revolutionary Features

### 🤖 **AI-Native Analysis**
- Automatic coding with semantic understanding
- Theme extraction with theoretical depth
- Saturation detection
- Negative case discovery
- Inter-coder reliability automation

### 🌍 **Community-Driven Methodologies**
- **RAG-powered methodology library**: Access community-contributed research methods
- **GitHub integration**: Share and discover methodologies from researchers worldwide
- **Validated approaches**: Peer-reviewed methodologies with quality ratings
- **Flexible**: Use established methods or create your own

### 🎯 **20 Specialized Tools**

#### Methodology Management (3)
- `selectMethodology` - AI finds the best methodology for your research
- `loadMethodology` - Load community methodologies
- `listMethodologies` - Browse available methods

#### Coding Tools (5)
- `autoCoding` - AI-powered automatic coding
- `refineCodebook` - Optimize your codebook
- `mergeCodesSmart` - Intelligent code merging
- `suggestSubcodes` - Hierarchical code suggestions
- `validateCoding` - Consistency checking

#### Thematic Analysis (4)
- `extractThemes` - Inductive/deductive theme extraction
- `analyzePatterns` - Pattern and relationship analysis
- `detectSaturation` - Theoretical saturation detection
- `compareThemesAcrossCases` - Cross-case comparison

#### Theory Building (3)
- `buildGroundedTheory` - Guided grounded theory development
- `generateConceptMap` - Automatic concept mapping
- `analyzeNarrative` - Narrative structure analysis

#### Validation (4)
- `findNegativeCases` - Negative case analysis
- `triangulate` - Multi-source triangulation
- `calculateReliability` - Inter-coder reliability
- `assessQuality` - Research quality assessment

#### Reporting (1)
- `generateReport` - Comprehensive analysis reports

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/seanshin0214/qualai-mcp.git
cd qualai-mcp

# Install dependencies
npm install

# Build
npm run build
```

### Configure Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "qualai": {
      "command": "node",
      "args": ["C:\\Users\\YOUR-USERNAME\\Documents\\qualai-mcp\\dist\\index.js"],
      "env": {
        "OPENAI_API_KEY": "your-openai-key-optional",
        "QUALAI_GITHUB_REPO": "qualai-community/methodologies"
      }
    }
  }
}
```

### Restart Claude Desktop

That's it! QualAI is now available in Claude.

**💬 First time? Try this:**
```
"I have 15 interview transcripts about remote work experiences.
Help me choose the right methodology and start coding."
```

---

## 🌍 Community Methodologies

### Current Methodologies (2)

**Built-in:**
1. **Constructivist Grounded Theory** (Charmaz, 2014)
2. **Reflexive Thematic Analysis** (Braun & Clarke, 2006)

**Community Contributed:**
- *Be the first to contribute!*

### Contributing Your Methodology

**Your methodology could help thousands of researchers worldwide.**

#### Step 1: Create Your Methodology

Use our template (see CONTRIBUTING.md)

#### Step 2: Test Locally

```bash
# Place in methodologies/ directory
cp your-methodology.json qualai-mcp/methodologies/

# Restart QualAI and test
```

#### Step 3: Share with Community

1. Fork [qualai-community/methodologies](https://github.com/qualai-community/methodologies)
2. Add your methodology with documentation
3. Create Pull Request
4. Community peer review (2+ reviewers)
5. Merged and available to all! 🎉

#### Recognition

- Your name appears in methodology metadata
- Automatic citation generation
- Contributor leaderboard
- Usage statistics (opt-in)

**Ready to contribute?** See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│        Claude Desktop               │
│  (User Interface & Conversations)   │
└──────────────┬──────────────────────┘
               │ MCP Protocol
┌──────────────▼──────────────────────┐
│         QualAI MCP Server           │
│                                     │
│  ┌────────────────────────────┐   │
│  │  Methodology Orchestrator  │   │
│  └────────────────────────────┘   │
│                                     │
│  ┌─────────┬─────────┬──────────┐ │
│  │ Coding  │ Thematic│ Theory   │ │
│  │ Engine  │ Engine  │ Engine   │ │
│  └─────────┴─────────┴──────────┘ │
│                                     │
│  ┌─────────────────────────────┐  │
│  │   RAG System (Qdrant)       │  │
│  │   - Community methodologies │  │
│  └─────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │   Knowledge Graph (SQLite)  │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   GitHub: qualai-community          │
│   Community Methodologies Registry  │
│   - YOUR methodology! 🌟            │
└─────────────────────────────────────┘
```

---

## 🤝 Contributing

We welcome all forms of contribution!

### Ways to Contribute

1. **📖 Share Methodologies**: Most valuable contribution!
2. **🐛 Report Bugs**: Help us improve
3. **💡 Suggest Features**: Shape QualAI's future
4. **📝 Improve Docs**: Help others learn
5. **💻 Submit Code**: Enhance functionality

---

## 📊 Roadmap

### v1.1 (Q1 2025)
- [ ] Interpretive Phenomenological Analysis (IPA)
- [ ] Discourse Analysis tools
- [ ] 10+ community methodologies

### v1.2 (Q2 2025)
- [ ] Real-time collaboration
- [ ] Multi-language support
- [ ] 25+ community methodologies

### v2.0 (Q3 2025)
- [ ] Web interface
- [ ] 50+ community methodologies

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 📞 Support & Community

- **💬 Discussions**: [GitHub Discussions](https://github.com/seanshin0214/qualai-mcp/discussions)
- **🐛 Issues**: [GitHub Issues](https://github.com/seanshin0214/qualai-mcp/issues)
- **📧 Email**: seanshin0214@gmail.com

---

## 🌟 Final Call to Action

**To Researchers Using QualAI:**
Your research benefits from methodologies shared by others. Consider giving back!

**To Methodology Innovators:**
Your unique approach could revolutionize how thousands conduct research. Share it!

**To the Qualitative Research Community:**
Together, we're building the world's most comprehensive, open, and accessible methodology library.

**Let's transform qualitative research together.**

[**→ Start Contributing Today**](https://github.com/qualai-community/methodologies)

---

**Made with ❤️ by researchers, for researchers**

**Version**: 1.0.0
**Last Updated**: 2025-11-02
