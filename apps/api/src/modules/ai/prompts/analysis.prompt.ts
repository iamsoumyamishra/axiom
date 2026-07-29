export interface AnalysisInput {
  title: string | null;
  url: string | null;
  content: string;
  wordCount: number;
}

export function buildAnalysisPrompt(input: AnalysisInput): string {
  return `You are an AI research assistant analyzing a saved web resource. Your task is to analyze the following content and return a structured JSON analysis.

## Resource Information
Title: ${input.title ?? 'Untitled'}
URL: ${input.url ?? 'N/A'}
Word Count: ${input.wordCount}

## Content
${input.content}

## Instructions
Analyze the content above and return a JSON object with the following fields:

- "category": A broad category for this resource (e.g., "Technology", "Science", "Business", "Design", "Health", "Education", "Programming", "Artificial Intelligence", "Photography", "Travel", "Finance", "Entertainment", "News", "Documentation", "Tutorial", "Reference"). Be specific but use existing taxonomies where possible.
- "subcategory": (optional) A more specific subcategory within the main category.
- "summary": A concise 2-3 sentence summary of what this resource is about and why it's valuable.
- "importance": An integer from 1-10 rating how important/useful this resource is (1 = trivial, 10 = essential).
- "qualityScore": (optional) A float from 0.0-1.0 rating the quality of the content.
- "noveltyScore": (optional) A float from 0.0-1.0 rating how novel or surprising the content is.
- "difficulty": (optional) One of "beginner", "intermediate", or "advanced" indicating the target audience level.
- "readingTime": (optional) Estimated reading time in minutes. Calculate based on content length, assuming average reading speed of 200 words per minute.
- "tags": An array of 3-10 relevant tags describing this resource. Tags should be lowercase, single words or short phrases.
- "topics": (optional) An array of broader topic areas this resource covers.
- "keyConcepts": (optional) An array of key concepts,术语, or ideas mentioned in the content.
- "entities": (optional) An array of named entities found in the content. Each entity should have:
  - "name": The entity name
  - "type": One of "person", "organization", "place", "concept", "technology", "product", "event"
  - "confidence": A float from 0.0-1.0 indicating confidence this is a real entity
- "confidence": (optional) A float from 0.0-1.0 indicating your overall confidence in this analysis.
- "reasoning": (optional) Brief internal reasoning about your analysis decisions.

IMPORTANT: Return ONLY valid JSON. No markdown formatting, no code blocks, no explanation outside the JSON object.`;
}
