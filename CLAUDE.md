# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Brave Browser Control extension for Claude Desktop that enables browser automation through AppleScript on macOS. It provides tools for tab management, navigation, page interaction, and JavaScript execution.

## Development Commands

```bash
# Install dependencies
npm install

# Run the MCP server
npm start
```

## Architecture

The project implements a Model Context Protocol (MCP) server that bridges Claude Desktop with Brave Browser using AppleScript automation.

### Key Components

- **server/index.js**: Main MCP server implementation
  - Handles tool registration and request routing
  - Executes AppleScript commands via `osascript`
  - Implements error handling for permissions and browser state

### Available Tools

All tools are implemented in server/index.js:31-445:

1. **open_url** - Opens URLs in new or current tab
2. **get_current_tab** - Returns active tab info (URL, title, ID)
3. **list_tabs** - Lists all open tabs across windows
4. **close_tab** - Closes tab by ID
5. **switch_to_tab** - Switches to tab by ID
6. **reload_tab** - Reloads current or specific tab
7. **go_back/go_forward** - Browser history navigation
8. **execute_javascript** - Runs JS in browser context
9. **get_page_content** - Extracts page text with link URLs preserved

### AppleScript Integration

The server uses `osascript -e` to execute AppleScript commands that control Brave Browser. Key patterns:

- Tab operations iterate through all windows and tabs to find matches by ID
- JavaScript execution properly escapes code for AppleScript strings
- Error handling includes specific checks for:
  - Permission denied (-1743): Requires System Settings > Privacy & Security > Automation
  - Browser not running (-600): Brave must be launched

### Security Considerations

- This extension can execute arbitrary JavaScript in browser tabs
- Requires macOS automation permissions for Brave Browser
- All AppleScript strings must be properly escaped to prevent injection

## GitHub Actions

The project includes Claude Code GitHub Actions for automated PR reviews:

- **.github/workflows/claude-code-review.yml**: Automated PR review on open/sync
- **.github/workflows/claude.yml**: Interactive Claude assistant triggered by @claude mentions