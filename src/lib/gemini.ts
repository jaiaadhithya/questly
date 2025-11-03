/**
 * Gemini + YouTube integration
 * Topic generation and YouTube search powered by Gemini (no Ollama dependency).
 */

// Model selection with fallbacks
const PRIMARY_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
const MODEL_FALLBACKS = [
  PRIMARY_MODEL,
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
];

// Use dev proxy to avoid browser CORS when running locally
const GEMINI_BASE = import.meta.env.VITE_GEMINI_BASE_URL || (import.meta.env.DEV ? '/gemini-api' : 'https://generativelanguage.googleapis.com');
const makeEndpoint = (model: string) => `${GEMINI_BASE}/v1/models/${model}:generateContent`;

const generateContentWithFallback = async (apiKey: string, body: string): Promise<any> => {
  let lastError: any = null;
  for (const model of MODEL_FALLBACKS) {
    try {
      const endpoint = makeEndpoint(model);
      const res = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      });
      if (res.status === 404) {
        console.warn(`[gemini] 404 on model ${model}, trying next`);
        lastError = new Error(`404 on ${model}`);
        continue;
      }
      if (!res.ok) {
        const err = new Error(`Gemini API error: ${res.status}`);
        lastError = err;
        console.warn(`[gemini] error ${res.status} on model ${model}, trying next`);
        continue;
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      console.warn(`[gemini] fetch failed on model ${model}, trying next`, err);
    }
  }
  throw lastError || new Error('Gemini generateContent failed on all models');
};

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
}

// Quiz item type for Gemini-generated mini quizzes
export interface MiniQuizItem {
  question: string;
  options: string[];
  correctIndex: number;
}

// Full quiz items for initial assessment (shared schema)
export interface GeminiQuizItem {
  question: string;
  options: string[];
  answer: string;
}

// Build a concise query using the first N words of the topic
const firstWords = (text: string, n = 4): string => {
  if (!text) return '';
  const normalized = text
    .replace(/[•|\-–—]+/g, ' ') // replace separators
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // remove non-letter/number
    .replace(/\s+/g, ' ')
    .trim();
  const words = normalized.split(' ').filter(Boolean).slice(0, n);
  return words.join(' ');
};

export interface GeneratedCheckpoint {
  checkpoint: string;
  order: number;
}

// Simple JSON array extractor from free-text
const extractArrayFromText = (text: string, keys: string[] = []): any[] | null => {
  if (!text) return null;
  let t = text.trim();
  t = t.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    const parsed = JSON.parse(t);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed) {
      for (const k of keys) {
        const v = (parsed as any)[k];
        if (Array.isArray(v)) return v;
      }
    }
  } catch {}
  const start = t.indexOf('[');
  const end = t.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = t.slice(start, end + 1);
    try {
      const arr = JSON.parse(candidate);
      if (Array.isArray(arr)) return arr;
    } catch {}
  }
  return null;
};

/**
 * Generate ordered checkpoints/topics from parsed content using Gemini.
 * Falls back to simple local extraction when API key is missing.
 */
export const generateCheckpointsWithGemini = async (content: string, count = 6): Promise<GeneratedCheckpoint[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  // Local fallback if no key
  if (!apiKey) {
    console.warn('[gemini] Missing API key. Using local fallback to derive checkpoints');
    const lines = content.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const candidates: string[] = [];
    for (const line of lines) {
      if (line.length > 15 && /[A-Za-z]/.test(line)) {
        candidates.push(line.replace(/\s+/g, ' ').slice(0, 60));
      }
      if (candidates.length >= count) break;
    }
    const uniq = Array.from(new Set(candidates)).slice(0, count);
    return uniq.map((c, idx) => ({ checkpoint: c, order: idx + 1 }));
  }

  const prompt = `You are an expert curriculum designer. From the following study materials, extract the core lesson topics ("checkpoints") a student should master, and order them logically from foundational to advanced. Return ONLY a minified JSON array of objects in this exact format (no markdown, no commentary):\n[\n  {"checkpoint": "Topic 1", "order": 1},\n  {"checkpoint": "Topic 2", "order": 2}\n]\nLimit to ${count} items.\n\nMaterials:\n${content.substring(0, 5000)}`;

  try {
    const data = await generateContentWithFallback(apiKey, JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }));
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[gemini] checkpoints raw response', text?.slice?.(0, 200));
    const arr = extractArrayFromText(text, ['checkpoints', 'items', 'data']) || [];
    const parsed = arr.map((item: any, idx: number) => ({
      checkpoint: String(item.checkpoint ?? item.topic ?? item.title ?? item.name ?? '').trim(),
      order: Number(item.order ?? item.index ?? (idx + 1)),
    })).filter((c: GeneratedCheckpoint) => c.checkpoint);
    if (parsed.length) return parsed.slice(0, count);
    // Fallback if parsing failed
    const lines = content.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const candidates = lines.filter(l => l.length > 15 && /[A-Za-z]/.test(l)).slice(0, count);
    return candidates.map((c, idx) => ({ checkpoint: c.replace(/\s+/g, ' ').slice(0, 60), order: idx + 1 }));
  } catch (err) {
    console.warn('Gemini checkpoints failed, using local fallback:', err);
    const lines = content.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const candidates = lines.filter(l => l.length > 15 && /[A-Za-z]/.test(l)).slice(0, count);
    return candidates.map((c, idx) => ({ checkpoint: c.replace(/\s+/g, ' ').slice(0, 60), order: idx + 1 }));
  }
};

/**
 * Ask Gemini to refine a search query for educational YouTube results.
 */
export const refineQueryWithGemini = async (topic: string, baseQuery: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    // No API key; fallback to base query
    return baseQuery;
  }

  const prompt = `You are tasked ONLY with crafting a precise YouTube search query for learning about "${topic}".
Return a single search query string that would yield high-quality educational videos (lectures, tutorials) on YouTube.
Do not include explanation, just the query.`;

  try {
    const requestBody = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
    const data = await generateContentWithFallback(apiKey, requestBody);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || baseQuery;
    return (text as string).trim();
  } catch (err) {
    console.error('Gemini refine query failed:', err);
    return baseQuery;
  }
};

/**
 * Search YouTube for videos given a query.
 */
export const searchYouTube = async (query: string, maxResults = 3): Promise<YouTubeVideo[]> => {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || import.meta.env.VITE_GOOGLE_CSE_API_KEY;
  if (!apiKey) {
    console.warn('Missing YouTube API key and Google CSE key; cannot search YouTube');
    return [];
  }
  console.log('[youtube] query:', query);
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', String(maxResults));
  // Use the concise query directly
  url.searchParams.set('q', query);
  url.searchParams.set('order', 'relevance');
  // Ensure results are embeddable outside YouTube
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('videoSyndicated', 'true');
  // Bias toward safe, English content
  url.searchParams.set('safeSearch', 'moderate');
  url.searchParams.set('relevanceLanguage', 'en');
  url.searchParams.set('key', apiKey);
  console.log('[youtube] request:', url.toString());
  const res = await fetch(url.toString());
  if (!res.ok) {
    // Try to surface the actual API error details to the console for debugging
    let bodyText = '';
    try {
      const errJson = await res.json();
      bodyText = JSON.stringify(errJson);
    } catch {
      try {
        bodyText = await res.text();
      } catch {
        bodyText = '';
      }
    }
    console.error('[youtube] error response', res.status, bodyText);
    throw new Error(`YouTube API error: ${res.status}`);
  }
  const data = await res.json();
  const items = (data.items || []) as any[];
  console.log('[youtube] items:', items?.length);
  return items.map((item) => {
    const id = item.id?.videoId;
    const title = item.snippet?.title || 'Untitled';
    return {
      id,
      title,
      url: `https://www.youtube.com/watch?v=${id}`,
    } as YouTubeVideo;
  });
};

/**
 * Use Google Custom Search JSON API to find YouTube videos.
 * Requires: VITE_GOOGLE_CSE_API_KEY and VITE_GOOGLE_CSE_CX (Search Engine ID).
 */
export const searchYouTubeViaGoogleCSE = async (query: string, maxResults = 3): Promise<YouTubeVideo[]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_CSE_API_KEY;
  const cx = import.meta.env.VITE_GOOGLE_CSE_CX;
  if (!apiKey || !cx) {
    console.warn('[cse] Missing API key or CX; skipping Custom Search');
    return [];
  }
  const q = `site:youtube.com ${query}`;
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('q', q);
  url.searchParams.set('num', String(maxResults));
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', cx);
  url.searchParams.set('safe', 'active');
  try {
    console.log('[cse] request:', url.toString());
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`CSE API error: ${res.status}`);
    const data = await res.json();
    const items = (data.items || []) as any[];
    console.log('[cse] items:', items?.length);
    const videos: YouTubeVideo[] = [];
    for (const item of items) {
      const link: string = item.link || '';
      const title: string = item.title || 'Untitled';
      // Accept common YouTube URL forms
      if (/^https?:\/\/www\.youtube\.com\//.test(link) || /^https?:\/\/youtu\.be\//.test(link)) {
        let id = '';
        const mWatch = /[?&]v=([\w-]{11})/.exec(link);
        const mBe = /^https?:\/\/youtu\.be\/([\w-]{11})(?:[/?#].*)?$/.exec(link);
        const mShorts = /^https?:\/\/www\.youtube\.com\/shorts\/([\w-]{11})(?:[/?#].*)?$/.exec(link);
        if (mWatch) id = mWatch[1];
        else if (mBe) id = mBe[1];
        else if (mShorts) id = mShorts[1];
        const url = id ? `https://www.youtube.com/watch?v=${id}` : link;
        videos.push({ id, title, url });
      }
      if (videos.length >= maxResults) break;
    }
    console.log('[cse] youtube results', videos);
    return videos;
  } catch (err) {
    console.warn('[cse] search failed:', err);
    return [];
  }
};

/**
 * Fallback: Ask Gemini directly for YouTube links and parse them.
 * Returns an array of { url, title } objects.
 */
export const getYouTubeLinksViaGemini = async (topic: string, maxResults = 3): Promise<{ url: string; title?: string }[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    // No Gemini key; cannot fetch links
    return [];
  }

  const prompt = `Provide ONLY a minified JSON array (no markdown fences) of YouTube LEARNING videos for the topic "${topic}".
Rules:
- Focus on high-quality tutorials, lectures, or course content.
- EXCLUDE meme/music/non-educational videos. Do NOT include 'Rick Astley' or 'Never Gonna Give You Up'.
- Prefer reputable channels (universities, official, expert educators).
- Return direct video links only: "https://www.youtube.com/watch?v=..." or "https://youtu.be/..." or "https://www.youtube.com/shorts/...".
Format: up to ${maxResults} items, JSON only, each object with keys: url, title.
Example: [{"url":"https://www.youtube.com/watch?v=abc","title":"Intro Lecture"}]`;

  try {
    const requestBody = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
    const data = await generateContentWithFallback(apiKey, requestBody);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[gemini] youtube links raw response for topic', topic, text?.slice?.(0, 200));
    const arr = extractArrayFromText(text) || [];
    const links = arr
      .map((item: any) => ({ url: String(item.url || item.link || '').trim(), title: item.title ? String(item.title).trim() : undefined }))
      .filter((x: { url: string }) => /^https?:\/\/www\.youtube\.com\/.+|^https?:\/\/youtu\.be\/.+/.test(x.url))
      .filter((x: { url: string }) => !/rick\s*astley|never\s*gon+na\s*give\s*you\s*up/i.test(x.url));
    console.log('[gemini] parsed youtube links', links);
    return links.slice(0, maxResults);
  } catch (err) {
    console.warn('Gemini YouTube link fallback failed:', err);
    return [];
  }
};

/**
 * Get top YouTube videos for a topic by:
 * 1) Generating a base query with Ollama
 * 2) Refining it with Gemini
 * 3) Searching YouTube
 */
export const getVideosForTopic = async (topic: string, maxResults = 3): Promise<string[]> => {
  // Prefer Google Custom Search if configured; bypass Gemini entirely for video lookup
  const cseKey = import.meta.env.VITE_GOOGLE_CSE_API_KEY;
  const cseCx = import.meta.env.VITE_GOOGLE_CSE_CX;
  const baseQuery = firstWords(topic, 4);
  if (cseKey && cseCx) {
    const cseVideos = await searchYouTubeViaGoogleCSE(baseQuery, maxResults);
    if (cseVideos.length > 0) return cseVideos.map(v => v.url);
  }

  // Next, try YouTube Data API if available
  const videos = await searchYouTube(baseQuery, maxResults);
  if (videos.length > 0) return videos.map((v) => v.url);

  // Finally, use Gemini to fetch links as a fallback if available
  try {
    const links = await getYouTubeLinksViaGemini(topic, maxResults);
    if (links.length > 0) return links.map(l => l.url);
  } catch (err) {
    console.warn('[video] Gemini link fallback failed:', err);
  }
  console.warn('[video] No video links found via any method');
  return [];
};

/**
 * Generate a small multiple-choice quiz for a given topic using Gemini.
 * Returns 1–3 items suitable for in-modal mini quiz.
 */
export const generateMiniQuizForTopic = async (topic: string, count = 1): Promise<MiniQuizItem[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[gemini] Missing API key; using local mini quiz fallback');
    const q = `What is a core concept in ${topic}?`;
    return [{
      question: q,
      options: [
        'A random unrelated fact',
        `A fundamental idea of ${topic}`,
        'Only UI styling',
        'Network configuration only'
      ],
      correctIndex: 1,
    }];
  }

  const prompt = `Create ${count} concise multiple-choice quiz question(s) to test understanding of: "${topic}".
Rules:
- Focus on educational, conceptual understanding.
- Each question must have exactly 4 options.
- Mark the correct option by index (0-based).
Output ONLY minified JSON array, no markdown fences, matching this schema:
[
  {"question":"...","options":["A","B","C","D"],"correctIndex":1}
]`;

  try {
    const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
    const data = await generateContentWithFallback(apiKey, body);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[gemini] mini quiz raw', text?.slice?.(0, 200));
    const arr = extractArrayFromText(text) || [];
    const parsed = arr
      .map((item: any) => ({
        question: String(item.question || '').trim(),
        options: Array.isArray(item.options) ? item.options.map((o: any) => String(o)) : [],
        correctIndex: Number(item.correctIndex ?? item.answerIndex ?? 0),
      }))
      .filter((q: MiniQuizItem) => q.question && q.options.length === 4);
    if (parsed.length) return parsed.slice(0, count);
    // Fallback parsing or empty -> simple local question
    return [{
      question: `Which statement best describes ${topic}?`,
      options: [
        'It is unrelated to computing',
        `It includes key principles of ${topic}`,
        'It only refers to CSS styling',
        'It is a network hardware brand'
      ],
      correctIndex: 1,
    }];
  } catch (err) {
    console.warn('[gemini] mini quiz generation failed', err);
    return [{
      question: `Which statement best describes ${topic}?`,
      options: [
        'It is unrelated to computing',
        `It includes key principles of ${topic}`,
        'It only refers to CSS styling',
        'It is a network hardware brand'
      ],
      correctIndex: 1,
    }];
  }
};

/**
 * Generate multiple-choice quiz items from full content using Gemini.
 * Returns items in schema: { question, options[4], answer }.
 */
export const generateQuizQuestionsWithGemini = async (content: string, count = 5): Promise<GeminiQuizItem[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[gemini] Missing API key; using basic local quiz extraction');
    // Simple local fallback using definitions
    const sentences = content
      .split(/[\.!?\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && /[A-Za-z]/.test(s));
    const questions: GeminiQuizItem[] = [];
    const pick = (arr: string[], n: number) => arr.slice(0, n);
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const def = sentences[i];
      const distractors = pick(sentences.filter(s => s !== def), 3);
      const opts = [def, ...distractors].slice(0, 4);
      questions.push({ question: 'Which statement is true based on the materials?', options: opts, answer: def });
    }
    return questions.length ? questions : [{ question: 'Which statement is true based on the materials?', options: ['A', 'B', 'C', 'D'], answer: 'A' }];
  }

  const prompt = `You are an educational quiz generator. Create ${count} multiple-choice questions from these materials.
Rules:
- EXACTLY 4 options per item.
- The field "answer" MUST be the EXACT TEXT of one of the options.
- Output ONLY minified JSON array (no markdown/code fences/commentary), schema:
[
  {"question":"...","options":["A","B","C","D"],"answer":"A"}
]
Do not include any extra fields.

Materials:\n${content.substring(0, 5000)}`;

  try {
    const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
    const data = await generateContentWithFallback(apiKey, body);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[gemini] full quiz raw', text?.slice?.(0, 200));
    const arr = extractArrayFromText(text, ['questions', 'items', 'data']) || [];
    let parsed: GeminiQuizItem[] = arr.map((item: any) => {
      const question = String(item.question ?? item.q ?? item.prompt ?? item.text ?? '').trim();
      const options = Array.isArray(item.options) ? item.options.map((o: any) => String(o).trim()).filter(Boolean) : [];
      let answer = String(item.answer ?? item.correct ?? item.solution ?? item.correct_choice ?? '').trim();
      // Ensure answer is among options
      if (options.length === 4 && !options.includes(answer)) {
        answer = options[0] ?? '';
      }
      return { question, options, answer } as GeminiQuizItem;
    }).filter(q => q.question && q.options.length === 4 && q.answer);
    if (parsed.length) return parsed.slice(0, count);
    // minimal fallback
    return [{ question: 'Which statement best matches the material?', options: ['A', 'B', 'C', 'D'], answer: 'A' }];
  } catch (err) {
    console.warn('[gemini] full quiz generation failed', err);
    return [{ question: 'Which statement best matches the material?', options: ['A', 'B', 'C', 'D'], answer: 'A' }];
  }
};
/**
 * Simple connectivity check to Gemini. Returns the raw text.
 */
export const pingGemini = async (message: string = 'hi'): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[gemini] Missing API key for ping');
    return '';
  }
  const body = JSON.stringify({ contents: [{ parts: [{ text: message }] }] });
  try {
    const data = await generateContentWithFallback(apiKey, body);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[gemini] ping response:', text);
    return String(text);
  } catch (err) {
    console.error('[gemini] ping failed:', err);
    return '';
  }
};

/**
 * Generate an agentic tutor reply tailored to the topic and persona.
 * History is a list of { role, content } messages; userMessage is the latest user input.
 */
export interface TutorMessage { role: 'user' | 'assistant'; content: string }
export const generateTutorReply = async (
  topic: string,
  persona: string,
  history: TutorMessage[],
  userMessage: string
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const fallback = () => {
    const style = persona || 'Tutor';
    return `${style}: For ${topic}, a helpful way to think about this is to break it into core ideas, examples, and a quick practice step. What part is confusing you most?`;
  };
  if (!apiKey) {
    console.warn('[gemini] Missing API key for tutor chat');
    return fallback();
  }

  const personaGuide = `Persona: ${persona}.
Tone & style: educational, clear, encouraging. Avoid hallucinations.
Constraints:
- Keep replies concise (2–6 sentences) unless asked for more.
- Use the current topic "${topic}" as context.
- If uncertain, ask a clarifying follow-up question.
- Provide simple examples or steps when helpful.
`;

  const convo = history
    .slice(-10)
    .map(m => `${m.role === 'user' ? 'User' : 'Tutor'}: ${m.content}`)
    .join('\n');

  const prompt = `${personaGuide}
Conversation so far:\n${convo}\nUser: ${userMessage}\n\nTutor:`;

  try {
    const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
    const data = await generateContentWithFallback(apiKey, body);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = String(text).trim();
    return cleaned || fallback();
  } catch (err) {
    console.warn('[gemini] tutor reply generation failed', err);
    return fallback();
  }
};