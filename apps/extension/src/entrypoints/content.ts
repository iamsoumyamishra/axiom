import type { ExtractedPageData, MessageRequest, MessageResponse } from '../shared/types';

function extractPageData(selectedText?: string): ExtractedPageData {
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
    selectedText: selectedText || window.getSelection()?.toString() || undefined,
    html: document.documentElement.outerHTML,
    metadata: {
      author: getMeta('author'),
      publishDate: getMeta('published_time') ?? getMeta('published') ?? getMeta('date'),
      ogImage: getMeta('image'),
      favicon,
      siteName: getMeta('site_name') ?? getMeta('site'),
      language: document.documentElement.lang || undefined,
    },
  };
}

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    chrome.runtime.onMessage.addListener(
      (request: MessageRequest, _sender, sendResponse: (response: MessageResponse) => void) => {
        if (request.type === 'EXTRACT_PAGE_DATA' || request.type === 'EXTRACT_SELECTION') {
          try {
            const data = extractPageData(request.type === 'EXTRACT_SELECTION' ? undefined : request.selectedText);
            sendResponse({ success: true, data });
          } catch (err) {
            sendResponse({ success: false, error: String(err) });
          }
        }
        return true;
      },
    );
  },
});
