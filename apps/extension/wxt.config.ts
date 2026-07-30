import { defineConfig } from 'wxt';

export default defineConfig({
  manifestVersion: 3,
  srcDir: 'src',
  extensionApi: 'chrome',
  modules: [],
  manifest: {
    name: 'Axiom',
    description: 'AI-powered knowledge platform — save anything, find it naturally',
    version: '0.1.0',
    permissions: ['contextMenus', 'storage', 'activeTab', 'notifications', 'scripting'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Axiom',
    },
    commands: {
      'save-page': {
        suggested_key: { default: 'Ctrl+Shift+S' },
        description: 'Save current page to Axiom',
      },
    },
  },
});
