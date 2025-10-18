# Brave Control Extension

Cross-platform browser automation for Claude Desktop. Control Brave Browser through Claude using native automation on macOS and Windows.

## Features

- **Tab Management**: Open, close, switch between tabs
- **Navigation**: Navigate to URLs, go back/forward in history
- **Page Interaction**: Execute JavaScript, get page content
- **Browser Control**: Reload tabs, list all open tabs

## Available Tools

### `open_url`
Open a URL in Brave, either in a new tab or current tab.

### `get_current_tab`
Get information about the currently active tab (URL, title, ID).

### `list_tabs`
List all open tabs across all Brave windows.

### `close_tab`
Close a specific tab by its ID.

### `switch_to_tab`
Switch to a specific tab by its ID.

### `reload_tab`
Reload a tab (current tab or specific tab by ID).

### `go_back` / `go_forward`
Navigate through browser history.

### `execute_javascript`
Execute JavaScript code in a tab.

### `get_page_content`
Get the text content of a web page.

## Requirements

- **macOS** or **Windows**
- Brave Browser installed
- **Windows only**: ChromeDriver (compatible with your Brave version)
  - Download from: https://chromedriver.chromium.org/
  - Must be in system PATH or same directory as Node.js

## Installation

To install this extension for Claude Desktop, download and open the `brave-browser-control.dxt` file.

## Security

This extension requires access to control Brave Browser. It can:
- Read and modify web page content
- Navigate to any URL
- Execute JavaScript in browser tabs
- Open, close, and switch between tabs
- Access information about open tabs (URL, title)

**Platform-specific permissions:**
- **macOS**: Requires automation permissions in System Settings > Privacy & Security > Automation
- **Windows**: Uses Selenium WebDriver to control the browser (may launch new browser instances)

**Warning:** This extension provides powerful control over your browser. Only use it with trusted applications and be cautious about the commands you authorize. Since this tool can execute any JavaScript, it can potentially be used to perform malicious actions. Always review the scripts you are about to execute.

Use with appropriate caution and only grant access when necessary.