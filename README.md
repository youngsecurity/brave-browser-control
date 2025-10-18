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
- **Windows only**:
  - ChromeDriver (automatically included with extension)
  - **To control existing Brave tabs**: Launch Brave with remote debugging enabled (see setup below)

## Installation

To install this extension for Claude Desktop, download and open the `brave-browser-control.dxt` file.

## Windows Setup

The extension automatically uses your Brave profile (bookmarks, history, passwords, extensions). No setup required!

### Basic Usage (No Setup Needed)
1. **Close Brave** if it's currently running
2. Use Claude Desktop to control Brave
3. Extension will launch Brave with your profile automatically

Your bookmarks, history, passwords, and extensions will all be available.

### Advanced: Control Currently Open Tabs (Optional)
If you want to control tabs that are already open in your existing Brave window:

**Option 1 - Use the helper script:**
1. Run `launch-brave-for-automation.bat` from the extension directory
2. Use this Brave window for automation

**Option 2 - Manual setup:**
1. Close all Brave windows
2. Right-click your Brave shortcut → Properties
3. In the "Target" field, add: ` --remote-debugging-port=9222`
4. Launch Brave using this shortcut

This advanced mode lets you see and control tabs that are already open.

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