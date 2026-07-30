export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ExtractedPageData {
  url: string;
  title: string;
  selectedText?: string;
  html?: string;
  metadata: {
    author?: string;
    publishDate?: string;
    ogImage?: string;
    favicon?: string;
    siteName?: string;
    language?: string;
  };
}

export type MessageRequest =
  | { type: 'EXTRACT_PAGE_DATA'; selectedText?: string }
  | { type: 'EXTRACT_SELECTION' };

export type MessageResponse =
  | { success: true; data: ExtractedPageData }
  | { success: false; error: string };
