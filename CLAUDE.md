# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cross-platform Brave Browser Control extension for Claude Desktop that enables browser automation. It provides tools for tab management, navigation, page interaction, and JavaScript execution via a Model Context Protocol (MCP) server.

- **macOS**: Uses AppleScript for native browser control
- **Windows**: Uses Selenium WebDriver for browser automation

## Development Commands

```bash
# Install dependencies
npm install

# Run the MCP server
npm start

# Package the extension (rebuild .dxt file)
npx @anthropic-ai/dxt pack

# Validate manifest before packaging
npx @anthropic-ai/dxt validate manifest.json

# Clean and optimize existing .dxt file
npx @anthropic-ai/dxt clean brave-browser-control.dxt
```

## Architecture

The project implements an MCP server that bridges Claude Desktop with Brave Browser using platform-specific automation methods.

### Key Components

- **server/index.js**: Main MCP server implementation
  - `BraveControlServer` class handles tool registration and request routing
  - Platform detection: `IS_MACOS` and `IS_WINDOWS` constants determine automation method
  - **macOS implementation**: `executeAppleScript()` method executes AppleScript commands via `osascript`
  - **Windows implementation**: WebDriver methods (`initializeWebDriver()`, `*WebDriver()` methods) use Selenium
  - Comprehensive error handling for permissions and browser state
  - All 9 browser control tools implemented in the `CallToolRequestSchema` handler with platform routing

### Tool Implementation Patterns

All tools follow consistent patterns with platform-specific routing in server/index.js:

1. **Platform Routing**: Each tool handler checks platform and routes to appropriate implementation
   - macOS: Calls AppleScript-based methods
   - Windows: Calls WebDriver-based methods

2. **Tab ID Resolution**: Most tools accept optional `tab_id` parameter
   - **macOS**: Iterate through all windows/tabs to find matching ID
   - **Windows**: Use WebDriver window handles to identify tabs
   - If omitted: Operate on active tab/window

3. **macOS (AppleScript) Execution**:
   - Uses `osascript -e` for AppleScript commands
   - Proper string escaping for JavaScript code injection
   - Error handling for common issues:
     - Permission denied (-1743): Automation permissions required
     - Browser not running (-600): Brave must be launched

4. **Windows (WebDriver) Execution**:
   - `initializeWebDriver()` creates/reuses Selenium WebDriver instance
   - Automatically locates Brave executable in standard Windows paths
   - Manages browser launch and session lifecycle
   - Uses window handles instead of tab IDs

5. **JavaScript Injection**:
   - Both platforms support `execute_javascript` with proper code handling
   - `get_page_content` uses identical DOM traversal logic on both platforms
   - Format: "link text [URL]" for extracted links

### Security Architecture

- **macOS**: Requires automation permissions for Brave Browser in System Settings
- **Windows**: Requires ChromeDriver and may launch new browser instances
- Can execute arbitrary JavaScript in browser context on both platforms
- AppleScript strings (macOS) must be properly escaped to prevent injection
- WebDriver (Windows) handles escaping automatically
- Extension validates JavaScript URLs to filter out `javascript:void(0)`

### Extension Packaging

- **manifest.json**: DXT extension manifest with tool definitions
- **brave-browser-control.dxt**: Built extension package (zip archive)
- Platform support: macOS (darwin) and Windows (win32)
- Runtime requirement: Node.js >= 16.0.0
- Dependencies:
  - `@modelcontextprotocol/sdk`: MCP protocol implementation
  - `selenium-webdriver`: Browser automation for Windows

## GitHub Actions

The project includes Claude Code GitHub Actions:

- **.github/workflows/claude-code-review.yml**: Automated PR review on open/sync
- **.github/workflows/claude.yml**: Interactive Claude assistant triggered by @claude mentions

## Platform-Specific Setup

### macOS
- Requires automation permissions in System Settings > Privacy & Security > Automation
- Grant permissions for "Claude" to control "Brave Browser"
- AppleScript controls existing Brave instances without launching new windows

### Windows
- Requires ChromeDriver (compatible with Brave/Chrome version)
- ChromeDriver must be in system PATH or same directory as Node.js
- Extension automatically locates Brave in standard installation paths:
  - `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`
  - `C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe`
  - `%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe`
- WebDriver will launch a new Brave instance or connect to existing session

## Development Notes

- The `.dxt` file should not be committed to version control (added to .gitignore)
- **macOS**: AppleScript error codes are well-documented in the error handling
- **Windows**: WebDriver session persists across tool calls for performance
- Link preservation in `get_page_content` uses optimized array joining vs string concatenation
- All tools return consistent JSON response format via MCP protocol
- Platform detection happens at runtime, no need for separate builds

## Version Management

When updating the extension:
1. Update version in both `manifest.json` and `package.json`
2. Follow semantic versioning: `major.minor.patch`
3. Current version: 0.2.0 (added Windows support)