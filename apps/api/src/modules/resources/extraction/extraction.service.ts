import { Injectable } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

interface ExtractedContent {
  title: string | null;
  author: string | null;
  excerpt: string | null;
  siteName: string | null;
  length: number;
  rawHtml: string | null;
  markdown: string | null;
  cleanText: string | null;
  wordCount: number;
  readingTime: number;
}

@Injectable()
export class ExtractionService {
  private readonly turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
    });
  }

  async fetchAndExtract(url: string): Promise<ExtractedContent> {
    const html = await this.fetchUrl(url);
    return this.extractFromHtml(html, url);
  }

  async fetchUrl(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; AxiomBot/1.0; +https://axiom.app)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  extractFromHtml(html: string, url: string): ExtractedContent {
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
      return {
        title: this.extractTitle(document),
        author: null,
        excerpt: this.extractMetaContent(document, 'description'),
        siteName: this.extractMetaContent(document, 'site_name'),
        length: 0,
        rawHtml: null,
        markdown: null,
        cleanText: null,
        wordCount: 0,
        readingTime: 0,
      };
    }

    const markdown = article.content ? this.turndown.turndown(article.content) : null;
    const textContent = article.textContent ?? '';
    const wordCount = textContent ? this.countWords(textContent) : 0;

    return {
      title: article.title || null,
      author: article.byline || null,
      excerpt: article.excerpt || null,
      siteName: this.extractMetaContent(document, 'site_name') || null,
      length: article.length ?? 0,
      rawHtml: article.content ?? null,
      markdown,
      cleanText: textContent || null,
      wordCount,
      readingTime: Math.max(1, Math.ceil(wordCount / 200)),
    };
  }

  private extractTitle(document: Document): string | null {
    const ogTitle = this.extractMetaContent(document, 'title');
    if (ogTitle) return ogTitle;
    const titleEl = document.querySelector('title');
    return titleEl?.textContent?.trim() ?? null;
  }

  private extractMetaContent(document: Document, property: string): string | null {
    const og = document.querySelector(`meta[property="og:${property}"]`);
    if (og?.getAttribute('content')) return og.getAttribute('content');
    const name = document.querySelector(`meta[name="${property}"]`);
    return name?.getAttribute('content') ?? null;
  }

  private countWords(text: string): number {
    const cleaned = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned ? cleaned.split(' ').length : 0;
  }
}
