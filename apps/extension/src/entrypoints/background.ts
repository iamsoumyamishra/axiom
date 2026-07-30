import { apiPost, ApiError } from '../shared/api';
import { getTokens, getApiUrl } from '../shared/storage';
import type { ExtractedPageData } from '../shared/types';

async function registerContextMenus() {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: 'analyze-save',
    title: 'Analyze & Save',
    contexts: ['page', 'link', 'selection', 'image', 'video', 'audio'],
  });

  chrome.contextMenus.create({
    id: 'quick-save',
    title: 'Quick Save',
    contexts: ['page', 'link', 'selection', 'image'],
  });
}

async function checkAuth(): Promise<boolean> {
  const tokens = await getTokens();
  return tokens !== null;
}

function notify(title: string, message: string) {
  const iconUrl = chrome.runtime.getURL('icon-128.png');
  chrome.notifications.create({ type: 'basic', iconUrl, title, message });
}

async function saveToAxiom(data: {
  url: string;
  title?: string;
  selectedText?: string;
  html?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!(await checkAuth())) {
    notify('Not signed in', 'Open the extension popup to sign in to Axiom.');
    return null;
  }

  try {
    const result = await apiPost<{ id: string; status: string }>('resources', data);
    console.log('[Axiom] Saved:', result.id, result.status);

    if (result.status === 'DUPLICATE') {
      notify('Already saved', 'This resource was already in your library.');
    } else {
      notify('Saved to Axiom', data.title ?? 'Resource saved successfully.');
    }
    return result;
  } catch (err) {
    console.error('[Axiom] Save failed:', err);
    if (err instanceof ApiError) {
      notify('Save failed', err.message);
    } else {
      notify('Save failed', 'Check your connection and try again.');
    }
    return null;
  }
}

export default defineBackground(() => {
  registerContextMenus().catch(console.error);

  chrome.runtime.onInstalled.addListener(() => {
    registerContextMenus().catch(console.error);
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const tabId = tab?.id;
    if (!tabId) {
      console.warn('[Axiom] No tab ID');
      return;
    }

    if (info.menuItemId !== 'analyze-save' && info.menuItemId !== 'quick-save') return;

    console.log('[Axiom] Context menu clicked:', info.menuItemId, info.contextType);

    const analyze = info.menuItemId === 'analyze-save';
    let pageData: ExtractedPageData | null = null;

    if (info.linkUrl) {
      pageData = {
        url: info.linkUrl,
        title: info.selectionText ?? info.linkUrl,
        selectedText: info.selectionText,
        metadata: {},
      };
    } else if (info.srcUrl && (info.mediaType === 'image' || info.mediaType === 'video')) {
      pageData = {
        url: info.srcUrl,
        title: info.selectionText ?? `${info.mediaType} from ${tab.url ?? ''}`,
        selectedText: info.selectionText,
        metadata: { sourceUrl: tab.url },
      };
    } else if (info.selectionText) {
      pageData = {
        url: tab.url ?? '',
        title: tab.title ?? '',
        selectedText: info.selectionText,
        metadata: {},
      };
    } else {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const getMeta = (name: string): string | undefined => {
              const el =
                document.querySelector(`meta[name="${name}"]`) ??
                document.querySelector(`meta[property="og:${name}"]`) ??
                document.querySelector(`meta[property="article:${name}"]`);
              return el?.getAttribute('content') ?? undefined;
            };
            const favicon =
              document.querySelector<HTMLLinkElement>('link[rel*="icon"]')?.href ??
              `${location.origin}/favicon.ico`;
            return {
              url: location.href,
              title: document.title,
              html: document.documentElement.outerHTML.slice(0, 500_000),
              metadata: {
                author: getMeta('author'),
                publishDate: getMeta('published_time') ?? getMeta('published') ?? getMeta('date'),
                ogImage: getMeta('image'),
                favicon,
                siteName: getMeta('site_name') ?? getMeta('site'),
                language: document.documentElement.lang || undefined,
              },
            };
          },
        });
        pageData = results?.[0]?.result ?? null;
      } catch (err) {
        console.error('[Axiom] Script injection failed:', err);
      }
    }

    if (!pageData) {
      notify('Extraction failed', 'Could not extract page data from this page.');
      return;
    }

    await saveToAxiom({
      url: pageData.url,
      title: pageData.title,
      selectedText: pageData.selectedText,
      ...(analyze ? {} : { html: pageData.html }),
      metadata: pageData.metadata,
    });
  });

  chrome.commands.onCommand.addListener(async (command) => {
    if (command !== 'save-page') return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({ url: location.href, title: document.title }),
      });
      const data = results?.[0]?.result;
      if (data) await saveToAxiom({ url: data.url, title: data.title });
    } catch (err) {
      console.error('[Axiom] Keyboard shortcut failed:', err);
    }
  });
});
