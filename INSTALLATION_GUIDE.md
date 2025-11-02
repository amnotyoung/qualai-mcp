# 📦 QualAI Installation Guide

Complete step-by-step installation guide for QualAI MCP Server.

---

## 📋 Prerequisites

Before installing QualAI, ensure you have:

- **Claude Desktop** installed
- **Node.js** 18.0 or higher
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

---

## 🚀 Installation Methods

### Method 1: Clone from GitHub (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/seanshin0214/qualai-mcp.git
cd qualai-mcp

# 2. Install dependencies
npm install

# 3. Build the project
npm run build
```

### Method 2: Download ZIP

1. Download the ZIP file from [GitHub releases](https://github.com/seanshin0214/qualai-mcp/releases)
2. Extract to `C:\Users\[USERNAME]\Documents\qualai-mcp`
3. Open terminal in the extracted folder
4. Run:
   ```bash
   npm install
   npm run build
   ```

---

## ⚙️ Configuration

### Windows

1. **Open Claude Desktop config file**:
   ```
   C:\Users\[USERNAME]\AppData\Roaming\Claude\claude_desktop_config.json
   ```

2. **Add QualAI configuration**:
   ```json
   {
     "mcpServers": {
       "qualai": {
         "command": "node",
         "args": [
           "C:\\Users\\[USERNAME]\\Documents\\qualai-mcp\\dist\\index.js"
         ]
       }
     }
   }
   ```

3. **Replace `[USERNAME]`** with your actual Windows username

4. **Save the file**

### macOS

1. **Open Claude Desktop config file**:
   ```bash
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. **Add QualAI configuration**:
   ```json
   {
     "mcpServers": {
       "qualai": {
         "command": "node",
         "args": [
           "/Users/[USERNAME]/Documents/qualai-mcp/dist/index.js"
         ]
       }
     }
   }
   ```

3. **Replace `[USERNAME]`** with your actual username

4. **Save the file**

### Linux

1. **Open Claude Desktop config file**:
   ```bash
   ~/.config/Claude/claude_desktop_config.json
   ```

2. **Add QualAI configuration**:
   ```json
   {
     "mcpServers": {
       "qualai": {
         "command": "node",
         "args": [
           "/home/[USERNAME]/Documents/qualai-mcp/dist/index.js"
         ]
       }
     }
   }
   ```

3. **Replace `[USERNAME]`** with your actual username

4. **Save the file**

---

## 🔧 Verification

### 1. Restart Claude Desktop

**Completely quit** Claude Desktop:
- Windows: Right-click taskbar icon → Exit, or press Ctrl+Q
- macOS: Cmd+Q
- Linux: Close all windows and quit from system tray

Then **restart** Claude Desktop.

### 2. Check MCP Servers

1. Open Claude Desktop
2. Go to **Settings** → **Developer** → **MCP Servers**
3. Look for **qualai** in the list
4. Status should show **"running"** ✅

### 3. Test QualAI

Start a new conversation and try:

```
List available methodologies in QualAI
```

If Claude responds with methodology information, installation is successful! 🎉

---

## ❓ Troubleshooting

### QualAI doesn't appear in MCP Servers list

**Cause**: Config file syntax error or path incorrect

**Solution**:
1. Verify JSON syntax using [JSONLint](https://jsonlint.com/)
2. Check that the path to `index.js` is correct
3. Make sure you used **double backslashes** (`\\`) on Windows
4. Restart Claude Desktop completely

### Server shows "failed" status

**Cause**: Missing dependencies or build errors

**Solution**:
```bash
cd C:\Users\[USERNAME]\Documents\qualai-mcp
npm install
npm run build
```

Then restart Claude Desktop.

### "Server disconnected" error

**Cause**: stdout pollution from console.log

**Solution**:
- This should be fixed in the latest version
- If you see this error, please report it on [GitHub Issues](https://github.com/seanshin0214/qualai-mcp/issues)

### Node.js not found

**Cause**: Node.js not installed or not in PATH

**Solution**:
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Restart your terminal/command prompt
3. Verify installation: `node --version`

---

## 🔄 Updating QualAI

### If installed via Git:

```bash
cd C:\Users\[USERNAME]\Documents\qualai-mcp
git pull
npm install
npm run build
```

Then restart Claude Desktop.

### If installed via ZIP:

1. Download the latest release
2. Extract to the same folder (overwrite files)
3. Run:
   ```bash
   npm install
   npm run build
   ```
4. Restart Claude Desktop

---

## 🗑️ Uninstallation

1. **Remove from Claude Desktop config**:
   - Open `claude_desktop_config.json`
   - Remove the `"qualai"` section
   - Save the file

2. **Delete QualAI folder**:
   ```bash
   rm -rf C:\Users\[USERNAME]\Documents\qualai-mcp
   ```

3. **Restart Claude Desktop**

---

## 📚 Next Steps

After successful installation:

1. Read the [README.md](README.md) for feature overview
2. Check [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md) for technical details
3. See [INTRODUCTION.md](INTRODUCTION.md) for usage examples
4. Start your first qualitative research project!

---

## 🆘 Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/seanshin0214/qualai-mcp/issues)
- **Discussions**: [Ask questions and share tips](https://github.com/seanshin0214/qualai-mcp/discussions)
- **Email**: Contact the maintainer

---

**Installation complete! Happy researching! 🔬✨**
