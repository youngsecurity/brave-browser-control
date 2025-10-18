#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const execFileAsync = promisify(execFile);
const IS_MACOS = platform() === 'darwin';
const IS_WINDOWS = platform() === 'win32';

class BraveControlServer {
  constructor() {
    this.server = new Server(
      {
        name: 'brave-control',
        version: '0.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.driver = null;
    this.setupHandlers();
  }

  async initializeWebDriver() {
    if (this.driver) {
      return this.driver;
    }

    const fs = await import('fs');

    // Try to connect to existing Brave instance on debugging port
    const debugPort = 9222;

    try {
      // Try to connect to existing Brave instance first
      const connectOptions = new chrome.Options();
      connectOptions.debuggerAddress(`localhost:${debugPort}`);

      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(connectOptions)
        .build();

      console.error('✓ Connected to existing Brave instance on port', debugPort);
      return this.driver;
    } catch (connectError) {
      // Connection failed, fall back to launching new instance with user's profile
      console.error('Could not connect to existing Brave instance, launching with your profile...');

      const options = new chrome.Options();

      // Try to find Brave browser executable on Windows
      const bravePaths = [
        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        process.env.LOCALAPPDATA + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      ];

      let bravePath = null;
      for (const path of bravePaths) {
        try {
          if (fs.existsSync(path)) {
            bravePath = path;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }

      if (bravePath) {
        options.setChromeBinaryPath(bravePath);
      }

      // Use the user's actual Brave profile directory
      const userDataDir = process.env.LOCALAPPDATA + '\\BraveSoftware\\Brave-Browser\\User Data';

      if (fs.existsSync(userDataDir)) {
        // Check if user specified a profile via environment variable
        const profileName = process.env.BRAVE_PROFILE || 'Default';

        options.addArguments(`--user-data-dir=${userDataDir}`);
        options.addArguments(`--profile-directory=${profileName}`);

        console.error(`✓ Using Brave profile: "${profileName}"`);
        console.error(`  (Set BRAVE_PROFILE environment variable to use a different profile)`);
      } else {
        console.error('⚠ Brave profile not found, using temporary profile');
      }

      // Disable automation flags
      options.addArguments('--disable-blink-features=AutomationControlled');
      options.excludeSwitches(['enable-automation']);

      try {
        this.driver = await new Builder()
          .forBrowser('chrome')
          .setChromeOptions(options)
          .build();

        console.error('✓ Brave launched with your profile data');
        console.error('   Note: This is a new window - your currently open tabs are in a different session');

        return this.driver;
      } catch (profileError) {
        // If profile is locked (Brave already running), show helpful message
        if (profileError.message.includes('user data directory is already in use')) {
          throw new Error(
            'Cannot launch Brave - profile is already in use.\n\n' +
            'Your main Brave browser is already running. You have two options:\n\n' +
            '1. Close Brave and try again (extension will launch with your profile)\n' +
            '2. Keep Brave open and restart it with remote debugging:\n' +
            '   - Close all Brave windows\n' +
            '   - Run: launch-brave-for-automation.bat\n' +
            '   - Or manually add --remote-debugging-port=9222 to Brave shortcut\n\n' +
            'Option 2 lets you control your currently open tabs.'
          );
        }
        throw profileError;
      }
    }
  }

  async executeAppleScript(script) {
    try {
      const { stdout, stderr } = await execFileAsync('osascript', ['-e', script]);
      if (stderr) {
        console.error('AppleScript stderr:', stderr);
      }
      return stdout.trim();
    } catch (error) {
      console.error('AppleScript execution error:', error);

      // Check for common permission-related errors
      if (error.message.includes('(-1743)') ||
          error.message.includes('not allowed assistive access') ||
          error.message.includes('not authorized') ||
          error.message.includes('System Events')) {
        throw new Error(
          'Permission denied: Brave control requires automation permissions.\n\n' +
          'To grant permission:\n' +
          '1. Open System Settings > Privacy & Security > Automation\n' +
          '2. Find "Claude" in the list\n' +
          '3. Enable "Brave Browser" under Claude\n' +
          '4. You may need to restart Claude after granting permission\n\n' +
          'Note: You\'ll see a permission prompt the first time you use this extension.'
        );
      }

      // Check for Chrome not running
      if (error.message.includes('(-600)') ||
          error.message.includes('application isn\'t running') ||
          error.message.includes('Brave Browser')) {
        throw new Error(
          'Brave Browser is not running. Please launch Brave and try again.'
        );
      }

      throw new Error(`AppleScript error: ${error.message}`);
    }
  }

  // WebDriver methods for Windows
  async openUrlWebDriver(url, new_tab = true) {
    const driver = await this.initializeWebDriver();

    if (new_tab) {
      await driver.executeScript(`window.open('${url}', '_blank');`);
      const handles = await driver.getAllWindowHandles();
      await driver.switchTo().window(handles[handles.length - 1]);
    } else {
      await driver.get(url);
    }

    return `Opened ${url} in Brave`;
  }

  async getCurrentTabWebDriver() {
    const driver = await this.initializeWebDriver();
    const url = await driver.getCurrentUrl();
    const title = await driver.getTitle();
    const handle = await driver.getWindowHandle();

    return JSON.stringify({ url, title, id: handle }, null, 2);
  }

  async listTabsWebDriver() {
    const driver = await this.initializeWebDriver();
    const handles = await driver.getAllWindowHandles();
    const tabs = [];

    const currentHandle = await driver.getWindowHandle();

    for (const handle of handles) {
      await driver.switchTo().window(handle);
      const url = await driver.getCurrentUrl();
      const title = await driver.getTitle();
      tabs.push({ id: handle, url, title });
    }

    // Switch back to original tab
    await driver.switchTo().window(currentHandle);

    return JSON.stringify(tabs, null, 2);
  }

  async closeTabWebDriver(tab_id) {
    const driver = await this.initializeWebDriver();
    const handles = await driver.getAllWindowHandles();

    if (!handles.includes(tab_id)) {
      return 'Tab not found';
    }

    const currentHandle = await driver.getWindowHandle();
    await driver.switchTo().window(tab_id);
    await driver.close();

    // Switch to another tab if we closed the current one
    const remainingHandles = await driver.getAllWindowHandles();
    if (remainingHandles.length > 0 && tab_id === currentHandle) {
      await driver.switchTo().window(remainingHandles[0]);
    }

    return 'Tab closed';
  }

  async switchToTabWebDriver(tab_id) {
    const driver = await this.initializeWebDriver();
    const handles = await driver.getAllWindowHandles();

    if (!handles.includes(tab_id)) {
      return 'Tab not found';
    }

    await driver.switchTo().window(tab_id);
    return 'Switched to tab';
  }

  async reloadTabWebDriver(tab_id = null) {
    const driver = await this.initializeWebDriver();

    if (tab_id) {
      const handles = await driver.getAllWindowHandles();
      if (!handles.includes(tab_id)) {
        return 'Tab not found';
      }
      const currentHandle = await driver.getWindowHandle();
      await driver.switchTo().window(tab_id);
      await driver.navigate().refresh();
      await driver.switchTo().window(currentHandle);
    } else {
      await driver.navigate().refresh();
    }

    return 'Tab reloaded';
  }

  async goBackWebDriver(tab_id = null) {
    const driver = await this.initializeWebDriver();

    if (tab_id) {
      const handles = await driver.getAllWindowHandles();
      if (!handles.includes(tab_id)) {
        return 'Tab not found';
      }
      const currentHandle = await driver.getWindowHandle();
      await driver.switchTo().window(tab_id);
      await driver.navigate().back();
      await driver.switchTo().window(currentHandle);
    } else {
      await driver.navigate().back();
    }

    return 'Navigated back';
  }

  async goForwardWebDriver(tab_id = null) {
    const driver = await this.initializeWebDriver();

    if (tab_id) {
      const handles = await driver.getAllWindowHandles();
      if (!handles.includes(tab_id)) {
        return 'Tab not found';
      }
      const currentHandle = await driver.getWindowHandle();
      await driver.switchTo().window(tab_id);
      await driver.navigate().forward();
      await driver.switchTo().window(currentHandle);
    } else {
      await driver.navigate().forward();
    }

    return 'Navigated forward';
  }

  async executeJavaScriptWebDriver(code, tab_id = null) {
    const driver = await this.initializeWebDriver();

    let result;
    if (tab_id) {
      const handles = await driver.getAllWindowHandles();
      if (!handles.includes(tab_id)) {
        return 'Tab not found';
      }
      const currentHandle = await driver.getWindowHandle();
      await driver.switchTo().window(tab_id);
      result = await driver.executeScript(code);
      await driver.switchTo().window(currentHandle);
    } else {
      result = await driver.executeScript(code);
    }

    return result !== undefined ? String(result) : 'JavaScript executed';
  }

  async getPageContentWebDriver(tab_id = null) {
    const driver = await this.initializeWebDriver();

    const getContentWithLinksScript = `
      function getContentWithLinks() {
        function extractTextWithLinks(element) {
          const parts = [];
          for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
              parts.push(node.textContent);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'A' && node.href) {
                const linkText = node.textContent.trim();
                const href = node.href;
                if (linkText && href && href !== 'javascript:void(0)') {
                  parts.push(linkText + ' [' + href + ']');
                } else if (linkText) {
                  parts.push(linkText);
                }
              } else {
                parts.push(extractTextWithLinks(node));
              }
            }
          }
          return parts.join('');
        }
        return extractTextWithLinks(document.body);
      }
      return getContentWithLinks();
    `;

    let result;
    if (tab_id) {
      const handles = await driver.getAllWindowHandles();
      if (!handles.includes(tab_id)) {
        return 'Tab not found';
      }
      const currentHandle = await driver.getWindowHandle();
      await driver.switchTo().window(tab_id);
      result = await driver.executeScript(getContentWithLinksScript);
      await driver.switchTo().window(currentHandle);
    } else {
      result = await driver.executeScript(getContentWithLinksScript);
    }

    return result;
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'open_url',
          description: 'Open a URL in Brave',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to open' },
              new_tab: { type: 'boolean', description: 'Open in a new tab', default: true }
            },
            required: ['url']
          }
        },
        {
          name: 'get_current_tab',
          description: 'Get information about the current active tab',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'list_tabs',
          description: 'List all open tabs in Brave',
          inputSchema: {
            type: 'object',
            properties: {
              window_id: { type: 'number', description: 'Specific window ID to list tabs from' }
            }
          }
        },
        {
          name: 'close_tab',
          description: 'Close a specific tab',
          inputSchema: {
            type: 'object',
            properties: {
              tab_id: { type: 'number', description: 'ID of the tab to close' }
            },
            required: ['tab_id']
          }
        },
        {
          name: 'switch_to_tab',
          description: 'Switch to a specific tab',
          inputSchema: {
            type: 'object',
            properties: {
              tab_id: { type: 'number', description: 'ID of the tab to switch to' }
            },
            required: ['tab_id']
          }
        },
        {
          name: 'reload_tab',
          description: 'Reload a tab',
          inputSchema: {
            type: 'object',
            properties: {
              tab_id: { type: 'number', description: 'ID of the tab to reload' }
            }
          }
        },
        {
          name: 'go_back',
          description: 'Navigate back in browser history',
          inputSchema: {
            type: 'object',
            properties: {
              tab_id: { type: 'number', description: 'ID of the tab' }
            }
          }
        },
        {
          name: 'go_forward',
          description: 'Navigate forward in browser history',
          inputSchema: {
            type: 'object',
            properties: {
              tab_id: { type: 'number', description: 'ID of the tab' }
            }
          }
        },
        {
          name: 'execute_javascript',
          description: 'Execute JavaScript in the current tab',
          inputSchema: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'JavaScript code to execute' },
              tab_id: { type: 'number', description: 'ID of the tab' }
            },
            required: ['code']
          }
        },
        {
          name: 'get_page_content',
          description: 'Get the text content of the current page',
          inputSchema: {
            type: 'object',
            properties: {
              tab_id: { type: 'number', description: 'ID of the tab' }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'open_url': {
            const { url, new_tab = true } = args;

            if (IS_WINDOWS) {
              const result = await this.openUrlWebDriver(url, new_tab);
              return { content: [{ type: 'text', text: result }] };
            }

            const script = new_tab
              ? `tell application "Brave Browser" to open location "${url}"`
              : `tell application "Brave Browser" to set URL of active tab of front window to "${url}"`;

            await this.executeAppleScript(script);
            return { content: [{ type: 'text', text: `Opened ${url} in Brave` }] };
          }

          case 'get_current_tab': {
            if (IS_WINDOWS) {
              const result = await this.getCurrentTabWebDriver();
              return { content: [{ type: 'text', text: result }] };
            }

            const script = `
              tell application "Brave Browser"
                set currentTab to active tab of front window
                set tabInfo to {URL of currentTab, title of currentTab, id of currentTab}
                return tabInfo
              end tell
            `;
            const result = await this.executeAppleScript(script);
            const [url, title, id] = result.split(', ');
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ url, title, id: parseInt(id) }, null, 2)
              }]
            };
          }

          case 'list_tabs': {
            if (IS_WINDOWS) {
              const result = await this.listTabsWebDriver();
              return { content: [{ type: 'text', text: result }] };
            }

            const script = `
              tell application "Brave Browser"
                set tabsList to {}
                repeat with w in windows
                  repeat with t in tabs of w
                    set end of tabsList to {id of t as string, URL of t, title of t}
                  end repeat
                end repeat
                set AppleScript's text item delimiters to "|"
                set output to ""
                repeat with tabInfo in tabsList
                  set output to output & (item 1 of tabInfo) & "," & (item 2 of tabInfo) & "," & (item 3 of tabInfo) & "|"
                end repeat
                return output
              end tell
            `;
            const result = await this.executeAppleScript(script);
            const tabs = result.split('|').filter(tab => tab).map(tab => {
              const [id, url, title] = tab.split(',');
              return { id: parseInt(id), url, title };
            });
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(tabs, null, 2)
              }]
            };
          }

          case 'close_tab': {
            const { tab_id } = args;

            if (IS_WINDOWS) {
              const result = await this.closeTabWebDriver(tab_id);
              return { content: [{ type: 'text', text: result }] };
            }

            const script = `
              tell application "Brave Browser"
                repeat with w in windows
                  repeat with t in tabs of w
                    if (id of t as string) is "${tab_id}" then
                      close t
                      return "Tab closed"
                    end if
                  end repeat
                end repeat
                return "Tab not found"
              end tell
            `;
            const result = await this.executeAppleScript(script);
            return { content: [{ type: 'text', text: result }] };
          }

          case 'switch_to_tab': {
            const { tab_id } = args;

            if (IS_WINDOWS) {
              const result = await this.switchToTabWebDriver(tab_id);
              return { content: [{ type: 'text', text: result }] };
            }

            const script = `
              tell application "Brave Browser"
                repeat with w in windows
                  repeat with tabIndex from 1 to count of tabs of w
                    set t to tab tabIndex of w
                    if (id of t as string) is "${tab_id}" then
                      set active tab index of w to tabIndex
                      set index of w to 1
                      activate
                      return "Switched to tab"
                    end if
                  end repeat
                end repeat
                return "Tab not found"
              end tell
            `;
            const result = await this.executeAppleScript(script);
            return { content: [{ type: 'text', text: result }] };
          }

          case 'reload_tab': {
            const { tab_id } = args;

            if (IS_WINDOWS) {
              const result = await this.reloadTabWebDriver(tab_id);
              return { content: [{ type: 'text', text: result }] };
            }

            const script = tab_id ? `
              tell application "Brave Browser"
                repeat with w in windows
                  repeat with t in tabs of w
                    if (id of t as string) is "${tab_id}" then
                      reload t
                      return "Tab reloaded"
                    end if
                  end repeat
                end repeat
                return "Tab not found"
              end tell
            ` : `
              tell application "Brave Browser"
                reload active tab of front window
                return "Tab reloaded"
              end tell
            `;
            const result = await this.executeAppleScript(script);
            return { content: [{ type: 'text', text: result }] };
          }

          case 'go_back': {
            const { tab_id } = args;

            if (IS_WINDOWS) {
              const result = await this.goBackWebDriver(tab_id);
              return { content: [{ type: 'text', text: result }] };
            }

            const script = tab_id ? `
              tell application "Brave Browser"
                repeat with w in windows
                  repeat with t in tabs of w
                    if (id of t as string) is "${tab_id}" then
                      go back t
                      return "Navigated back"
                    end if
                  end repeat
                end repeat
                return "Tab not found"
              end tell
            ` : `
              tell application "Brave Browser"
                go back active tab of front window
                return "Navigated back"
              end tell
            `;
            const result = await this.executeAppleScript(script);
            return { content: [{ type: 'text', text: result }] };
          }

          case 'go_forward': {
            const { tab_id } = args;

            if (IS_WINDOWS) {
              const result = await this.goForwardWebDriver(tab_id);
              return { content: [{ type: 'text', text: result }] };
            }

            const script = tab_id ? `
              tell application "Brave Browser"
                repeat with w in windows
                  repeat with t in tabs of w
                    if (id of t as string) is "${tab_id}" then
                      go forward t
                      return "Navigated forward"
                    end if
                  end repeat
                end repeat
                return "Tab not found"
              end tell
            ` : `
              tell application "Brave Browser"
                go forward active tab of front window
                return "Navigated forward"
              end tell
            `;
            const result = await this.executeAppleScript(script);
            return { content: [{ type: 'text', text: result }] };
          }

          case 'execute_javascript': {
            const { code, tab_id } = args;

            if (IS_WINDOWS) {
              const result = await this.executeJavaScriptWebDriver(code, tab_id);
              return { content: [{ type: 'text', text: result }] };
            }

            // For AppleScript strings, we need to escape backslashes and double quotes
            const escapedCode = code
              .replace(/\\/g, '\\\\')  // Escape backslashes first
              .replace(/"/g, '\\"');   // Then escape double quotes
            const script = tab_id ? `
              tell application "Brave Browser"
                repeat with w in windows
                  repeat with t in tabs of w
                    if (id of t as string) is "${tab_id}" then
                      set result to execute t javascript "${escapedCode}"
                      return result
                    end if
                  end repeat
                end repeat
                return "Tab not found"
              end tell
            ` : `
              tell application "Brave Browser"
                execute active tab of front window javascript "${escapedCode}"
              end tell
            `;
            const result = await this.executeAppleScript(script);
            return { content: [{ type: 'text', text: result || 'JavaScript executed' }] };
          }

          case 'get_page_content': {
            const { tab_id } = args;

            if (IS_WINDOWS) {
              const result = await this.getPageContentWebDriver(tab_id);
              return { content: [{ type: 'text', text: result }] };
            }

            // Optimized JavaScript function for extracting page content with preserved links
            const getContentWithLinksScript = `
              function getContentWithLinks() {
                function extractTextWithLinks(element) {
                  const parts = [];
                  for (let node of element.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                      parts.push(node.textContent);
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                      if (node.tagName === 'A' && node.href) {
                        const linkText = node.textContent.trim();
                        const href = node.href;
                        // Only include valid links with both text and href
                        if (linkText && href && href !== 'javascript:void(0)') {
                          parts.push(linkText + ' [' + href + ']');
                        } else if (linkText) {
                          parts.push(linkText);
                        }
                      } else {
                        parts.push(extractTextWithLinks(node));
                      }
                    }
                  }
                  return parts.join('');
                }
                return extractTextWithLinks(document.body);
              }
              getContentWithLinks();
            `;

            const script = tab_id ? `
              tell application "Brave Browser"
                repeat with w in windows
                  repeat with t in tabs of w
                    if (id of t as string) is "${tab_id}" then
                      set pageContent to execute t javascript "${getContentWithLinksScript}"
                      return pageContent
                    end if
                  end repeat
                end repeat
                return "Tab not found"
              end tell
            ` : `
              tell application "Brave Browser"
                execute active tab of front window javascript "${getContentWithLinksScript}"
              end tell
            `;
            const result = await this.executeAppleScript(script);
            return { content: [{ type: 'text', text: result }] };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Brave Control MCP server running on stdio');
  }
}

// Export the class for testing
export { BraveControlServer };

// Start the server (unless imported for testing with explicit flag)
if (!process.env.BRAVE_CONTROL_NO_AUTO_START) {
  const server = new BraveControlServer();
  server.run().catch(console.error);
}