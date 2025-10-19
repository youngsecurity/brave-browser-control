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
3. Extension will launch Brave with your Default profile automatically

Your bookmarks, history, passwords, and extensions will all be available.

### Selecting a Specific Profile
If you have multiple Brave profiles and want to use a specific one:

1. **Find your profile name:**
   - Navigate to: `%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\`
   - Look for folders like `Default`, `Profile 1`, `Profile 2`, etc.
   - Note the exact folder name (e.g., `Profile 1`)

2. **Set the environment variable in Claude Desktop config:**
   - Open Claude Desktop settings
   - Find the MCP servers configuration
   - Add `BRAVE_PROFILE` environment variable to the brave-control server config
   - Example value: `Profile 1`

3. **Or set it system-wide:**
   - Open System Properties → Environment Variables
   - Add user variable: `BRAVE_PROFILE` = `Profile 1`
   - Restart Claude Desktop

### Tab Management

**Basic Usage (Default Mode):**
1. **Close Brave** if it's running
2. Use Claude Desktop to control Brave
3. Extension launches Brave with your profile (bookmarks, history, passwords, extensions)
4. **To restore your tabs:** Press `Ctrl+Shift+T` in Brave to reopen recently closed tabs

**Note:** The extension does NOT automatically restore previously open tabs. Brave's session restore feature doesn't work reliably when launched via WebDriver. Use Brave's built-in "Recently Closed" feature (`Ctrl+Shift+T`) to restore tabs you need.

**Advanced: Control Currently Open Tabs (Optional)**

If you want to control tabs that are ALREADY open in a running Brave instance:

1. Close all Brave windows
2. Right-click your Brave shortcut → Properties
3. In the "Target" field, add to the end: ` --remote-debugging-port=9222`
4. Launch Brave using this modified shortcut
5. Claude Desktop can now control your currently open tabs in real-time

This mode lets you work with tabs you already have open without closing Brave first.

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

## Credits

This project is based on the original work by [Tariq Alagha](https://github.com/TariqAlagha/brave-browser-control). Windows support and cross-platform enhancements added by [youngsecurity.net](https://youngsecurity.net).

## License

MIT License - See [LICENSE](LICENSE) file for details.