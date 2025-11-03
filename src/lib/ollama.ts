/**
 * Ollama integration for local LLM processing
 * Handles quiz generation, checkpoint generation, and search prompts
 */

// Interface for quiz question
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

// Interface for checkpoint/topic
export interface Checkpoint {
  checkpoint: string;
  order: number;
}

/**
 * Generate quiz questions from parsed content using Ollama
 * @param content The parsed content to generate questions from
 * @param count Number of questions to generate
 * @returns Promise with array of quiz questions
 */
export const generateQuizQuestions = async (
  content: string,
  count: number = 5,
  opts?: { signal?: AbortSignal }
): Promise<QuizQuestion[]> => {
  try {
    console.log('[ollama] generateQuizQuestions start', { contentLen: content.length, count });
    const prompt = `You are a pedagogy-savvy quiz generator.
Create ${count} multiple-choice questions that assess understanding and application (avoid pure definition "What is X" stems unless unavoidable).
Rules:
- Each item must have a clear, concise stem (e.g., purpose, effect, next step, choose correct statement).
- Exactly 4 options per item. Use plausible distractors from the provided material.
- Provide the correct option text in the field "answer".
Output ONLY a minified JSON array (no markdown, no prefaces), format:
[
  {"question":"...","options":["A","B","C","D"],"answer":"A"}
]

Material:
${content.substring(0, 4000)}
`;

    const response = await callOllama(prompt, { signal: opts?.signal });
    console.log('[ollama] generateQuizQuestions raw response', { len: response.length, sample: response.slice(0, 200) });

    let arr = extractJSONArrayOrObjectArray(response, ['questions', 'items', 'data'])
      || deepArraySearch(response);
    if (!arr) {
      // Attempt to parse a single object question and wrap as array
      try {
        const obj = JSON.parse(response);
        const hasQ = obj && (obj.question || obj.q || obj.prompt || obj.text);
        const hasOpts = obj && (obj.options || obj.choices || obj.alternatives || obj.optionA || obj.a);
        if (hasQ && hasOpts) arr = [obj];
      } catch {}
    }
    if (!arr) {
      console.warn('[ollama] no JSON array extracted, using local basic quiz fallback');
      return basicQuizFromText(content, count);
    }

    let questions = normalizeQuizItems(arr, content);
    // If normalization resulted in zero items, attempt a string-based parse of the raw response
    if (!questions.length) {
      const alt = normalizeQuizItems([response], content);
      if (alt.length) {
        console.warn('[ollama] fallback string normalization succeeded', { count: alt.length });
        questions = alt;
      }
    }
    if (!questions.length) {
      console.warn('[ollama] parsed but no valid items, using local basic quiz fallback');
      return basicQuizFromText(content, count);
    }
    console.log('[ollama] generateQuizQuestions parsed', { count: questions.length });
    return questions;
  } catch (error) {
    console.error('[ollama] quiz generation failed, using local basic quiz fallback', error);
    return basicQuizFromText(content, count);
  }
};

/**
 * Reformat quiz items through the local model, ensuring final output is produced locally.
 */
export const reformatQuizWithOllama = async (items: QuizQuestion[], opts?: { signal?: AbortSignal }): Promise<QuizQuestion[]> => {
  const input = JSON.stringify(items);
  const prompt = `You will be given a JSON array of multiple-choice quiz items. Output ONLY a minified JSON array in the exact schema (ECHO EXACT INPUT, VERBATIM):
[
  {"question":"...","options":["A","B","C","D"],"answer":"A"}
]
Return EXACTLY the same array (no changes, no commentary, no code fences, no extra whitespace). Just echo input:\n${input}`;
  const response = await callOllama(prompt, { signal: opts?.signal });
  let arr = extractJSONArrayOrObjectArray(response, ['questions', 'items', 'data'])
    || deepArraySearch(response);
  if (!arr) {
    // Attempt to parse a single object and wrap as array
    try {
      const obj = JSON.parse(response);
      const hasQ = obj && (obj.question || obj.q || obj.prompt || obj.text || obj.stem || obj.title);
      const hasOpts = obj && (obj.options || obj.choices || obj.alternatives || obj.optionA || obj.a);
      if (hasQ && hasOpts) arr = [obj];
    } catch {}
  }
  if (!arr) {
    console.warn('[ollama] echo parse failed; returning original items');
    return items;
  }
  const normalized = normalizeQuizItems(arr);
  if (!normalized.length) {
    console.warn('[ollama] echo normalized to zero; returning original items');
    return items;
  }
  return normalized;
};

/**
 * Generate checkpoints/topics from parsed content using Ollama
 * @param content The parsed content to generate checkpoints from
 * @returns Promise with array of checkpoints
 */
export const generateCheckpoints = async (
  content: string,
  opts?: { signal?: AbortSignal }
): Promise<Checkpoint[]> => {
  try {
    console.log('[ollama] generateCheckpoints start', { contentLen: content.length });
    const prompt = `
      Based on the following educational content, identify the main topics or checkpoints
      that a student should master. Order them in a logical learning sequence.
      Return ONLY a valid minified JSON array (no markdown, no explanations) with the format:
      [
        {"checkpoint": "Topic 1", "order": 1},
        {"checkpoint": "Topic 2", "order": 2}
      ]
      
      Content:
      ${content.substring(0, 4000)}
    `;

    const response = await callOllama(prompt, { signal: opts?.signal });
    console.log('[ollama] generateCheckpoints raw response', { len: response.length, sample: response.slice(0, 200) });

    const arr = extractJSONArrayOrObjectArray(response, ['checkpoints', 'items', 'data'])
      || deepArraySearch(response);
    if (!arr) throw new Error('Failed to extract JSON from Ollama response');

    let checkpoints = normalizeCheckpoints(arr);
    if (!checkpoints.length) throw new Error('Parsed JSON but no valid checkpoints');
    console.log('[ollama] generateCheckpoints parsed', { count: checkpoints.length });
    return checkpoints;
  } catch (error) {
    console.error('Error generating checkpoints:', error);
    // Fast local fallback topics
    const fallback = basicCheckpointsFromText(content);
    console.warn('[ollama] using local fallback checkpoints', { count: fallback.length });
    return fallback;
  }
};

/**
 * Generate search queries for YouTube videos based on topics
 * @param topic The topic to generate a search query for
 * @returns Promise with search query string
 */
export const generateSearchQuery = async (topic: string): Promise<string> => {
  try {
    const prompt = `
      Generate a specific and effective YouTube search query for learning about:
      "${topic}"
      
      The query should be focused on educational content and return only the query text without any explanation.
    `;

    const response = await callOllama(prompt);
    return response.trim();
  } catch (error) {
    console.error('Error generating search query:', error);
    return `learn ${topic} tutorial`;
  }
};

/**
 * Call Ollama API with a prompt
 * @param prompt The prompt to send to Ollama
 * @returns Promise with response text
 */
const callOllama = async (prompt: string, opt?: { signal?: AbortSignal, timeoutMs?: number }): Promise<string> => {
  const preferred = (typeof window !== 'undefined' && localStorage.getItem('ollama:model'))
    || import.meta.env.VITE_OLLAMA_MODEL
    || 'phi3:mini';

  const candidates = [
    import.meta.env.VITE_OLLAMA_HOST ? `${import.meta.env.VITE_OLLAMA_HOST}/api/generate` : '/ollama/api/generate',
    'http://localhost:11434/api/generate',
  ];

  const tagsEndpoints = [
    import.meta.env.VITE_OLLAMA_HOST ? `${import.meta.env.VITE_OLLAMA_HOST}/api/tags` : '/ollama/api/tags',
    'http://localhost:11434/api/tags',
  ];

  // Try to resolve to an available model by checking /api/tags
  const model = await resolveModel(preferred, tagsEndpoints).catch(() => preferred);

  const payload = {
    model,
    prompt,
    stream: false,
    options: { temperature: 0, num_predict: 512 },
    format: 'json',
  };

  let lastError: any = null;
  for (const endpoint of candidates) {
    try {
      console.log('[ollama] calling', { endpoint, model, promptLen: prompt.length });
      const controller = new AbortController();
      const signal = opt?.signal || controller.signal;
      const timeoutMs = opt?.timeoutMs ?? Number(import.meta.env.VITE_OLLAMA_TIMEOUT_MS || 8000);
      const timeout = setTimeout(() => {
        try { controller.abort('timeout'); } catch {}
      }, timeoutMs);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      }).finally(() => clearTimeout(timeout));
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama error ${response.status}: ${text}`);
      }
      const data = await response.json();
      console.log('[ollama] response ok');
      return data.response as string;
    } catch (err) {
      console.error('[ollama] endpoint failed', endpoint, err);
      lastError = err;
      continue;
    }
  }
  throw lastError || new Error('Ollama call failed');
};

// Attempt to extract a JSON array from arbitrary text
const extractJSONArray = (text: string): any[] | null => {
  if (!text) return null;
  let t = text.trim();
  // Remove code fences if present
  t = t.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  // Try direct parse
  try {
    const parsed = JSON.parse(t);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Find bracketed array substring
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

// If the response is an object, attempt to pick an array from known keys
const extractJSONArrayOrObjectArray = (text: string, keys: string[]): any[] | null => {
  const arr = extractJSONArray(text);
  if (arr) return arr;
  try {
    const obj = JSON.parse(text);
    if (Array.isArray(obj)) return obj;
    for (const k of keys) {
      const v = (obj as any)[k];
      if (Array.isArray(v)) return v;
    }
  } catch {}
  return null;
};

// Brute force: attempt to find the first valid JSON array by scanning text
const deepArraySearch = (text: string): any[] | null => {
  if (!text) return null;
  const s = text;
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '[') continue;
    for (let j = s.length - 1; j > i; j--) {
      if (s[j] !== ']') continue;
      const candidate = s.slice(i, j + 1);
      try {
        const arr = JSON.parse(candidate);
        if (Array.isArray(arr)) return arr;
      } catch {}
    }
  }
  return null;
};

const normalizeQuizItems = (arr: any[], context?: string): QuizQuestion[] => {
  const parseFromString = (s: string): QuizQuestion | null => {
    const text = s.replace(/```[\s\S]*?```/g, '').trim();
    // Split into lines for easier extraction
    const lines = text.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    // Find option lines (A/B/C/D)
    const optRegex = /^(?:[A-D]|[1-4])\s*[\.)]\s*(.+)$/i;
    const options: string[] = [];
    let question = '';
    let answerLetter: string | null = null;
    for (const line of lines) {
      const m = line.match(optRegex);
      if (m) {
        options.push(m[1].trim());
        continue;
      }
      const ansM = line.match(/^(?:Answer|Correct)\s*[:=]\s*([A-D]|[1-4])/i);
      if (ansM) {
        answerLetter = ansM[1].toUpperCase();
        continue;
      }
    }
    // Question is everything before first option line
    const firstOptIdx = lines.findIndex(l => optRegex.test(l));
    question = firstOptIdx > 0 ? lines.slice(0, firstOptIdx).join(' '): lines[0];
    if (!question || options.length < 2) return null;
    let answer = options[0];
    if (answerLetter) {
      const idx = /[A-D]/i.test(answerLetter) ? (answerLetter.charCodeAt(0) - 'A'.charCodeAt(0)) : (parseInt(answerLetter) - 1);
      answer = options[Math.max(0, Math.min(options.length - 1, idx))];
    } else {
      // Try to find (correct) marker on options
      const markedIdx = lines.findIndex(l => /(correct|\*+)/i.test(l) && optRegex.test(l));
      if (markedIdx !== -1) {
        const m2 = lines[markedIdx].match(optRegex);
        if (m2) answer = m2[1].trim();
      }
    }
    return { question, options, answer };
  };

  const fromContextDistractors = (exclude: string) => {
    if (!context) return [];
    const words = context.toLowerCase().match(/[a-zA-Z][a-zA-Z\-]{3,}/g) || [];
    const freq: Record<string, number> = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    const vocab = Object.keys(freq).filter(w => w !== exclude).sort((a, b) => freq[b] - freq[a]);
    return vocab.slice(0, 3);
  };

  const coerceOptions = (item: any): string[] => {
    const raw = item.options ?? item.choices ?? item.alternatives ?? [
      item.optionA ?? item.a,
      item.optionB ?? item.b,
      item.optionC ?? item.c,
      item.optionD ?? item.d,
    ].filter(Boolean);
    let opts: string[] = [];
    if (Array.isArray(raw)) {
      // choices might be objects: { text: "...", is_correct: true }
      opts = raw.map((o: any) => typeof o === 'string' ? o : String(o?.text ?? o?.value ?? o)).filter(Boolean);
    } else if (typeof raw === 'object' && raw) {
      opts = Object.values(raw).map((o: any) => String(o)).filter(Boolean);
    }
    // Deduplicate and trim
    opts = Array.from(new Set(opts.map(o => o.trim()))).filter(Boolean);
    // If fewer than 2 options, synthesize distractors from context
    if (opts.length < 2) {
      const base = String(item.answer ?? item.correct ?? item.solution ?? item.correct_choice ?? '') || 'Answer';
      const distract = fromContextDistractors(base);
      const merged = [base, ...distract];
      // ensure at least 2
      opts = merged.length >= 2 ? merged : [base, 'None of the above'];
    }
    return opts;
  };

  const coerceAnswer = (item: any, options: string[]): string => {
    let ans: any = item.answer ?? item.correct ?? item.solution ?? item.correct_choice ?? item.correctAnswer;
    if (ans == null) ans = item.answer_text ?? item.answerValue;
    // If numeric index
    if (typeof ans === 'number') {
      const idx = Math.max(0, Math.min(options.length - 1, ans));
      return options[idx] ?? options[0] ?? '';
    }
    // If letter like 'A'/'B'/'C'/'D'
    if (typeof ans === 'string' && /^[A-D]$/i.test(ans)) {
      const idx = ans.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
      return options[idx] ?? options[0] ?? '';
    }
    // If object with is_correct
    if (Array.isArray(item.choices)) {
      const found = item.choices.find((c: any) => c?.is_correct);
      if (found) {
        const txt = typeof found === 'string' ? found : (found.text ?? found.value);
        if (txt) return String(txt);
      }
    }
    return typeof ans === 'string' ? ans : String(ans ?? options[0] ?? '');
  };

  return arr.map((item) => {
    if (typeof item === 'string') {
      const parsed = parseFromString(item);
      return parsed ? parsed : { question: '', options: [], answer: '' };
    }
    let question = String(item.question ?? item.q ?? item.prompt ?? item.text ?? item.stem ?? item.query ?? item.title ?? '');
    let options = coerceOptions(item);
    let answer = coerceAnswer(item, options);
    // Ensure answer is among options; if not, default to first option
    if (!options.includes(answer)) {
      answer = options[0] ?? answer ?? '';
    }
    // Ensure exactly 4 options; if fewer, synthesize from context
    if (options.length < 4) {
      const distract = fromContextDistractors(answer);
      options = [answer, ...distract, 'None of the above'].slice(0, 4);
    } else if (options.length > 4) {
      options = options.slice(0, 4);
    }
    // If question still empty, construct a generic stem
    if (!question) {
      question = 'Select the correct answer based on the materials.';
    }
    return { question, options, answer } as QuizQuestion;
  }).filter(q => q.question && Array.isArray(q.options) && q.options.length >= 2);
};

const normalizeCheckpoints = (arr: any[]): Checkpoint[] => {
  return arr.map((item, idx) => {
    const checkpoint = String(item.checkpoint ?? item.topic ?? item.title ?? item.name ?? '');
    const order = Number(item.order ?? item.index ?? (idx + 1));
    return { checkpoint, order } as Checkpoint;
  }).filter(c => c.checkpoint);
};

// Local quick fallback quiz generator from raw text (definition-style)
const basicQuizFromText = (text: string, count: number): QuizQuestion[] => {
  const sentences = text
    .split(/[\.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && /[A-Za-z]/.test(s));

  type DefPair = { term: string; def: string };
  const defs: DefPair[] = [];
  for (const s of sentences) {
    const m = s.match(/([A-Za-z][A-Za-z0-9\-\s]{2,})\s+(is|are|refers to|means|denotes)\s+(.{10,})/i);
    if (m) {
      const term = m[1].replace(/\s+/g, ' ').trim();
      let def = m[3].replace(/\s+/g, ' ').trim();
      def = def.replace(/^[\"\'-]+/, '').replace(/[\"\'-]+$/, '');
      def = def.slice(0, 160);
      if (term && def) defs.push({ term, def });
    }
    if (defs.length >= count * 4) break;
  }
  // Deduplicate by term
  const uniqMap = new Map<string, string>();
  for (const d of defs) {
    if (!uniqMap.has(d.term)) uniqMap.set(d.term, d.def);
  }
  const uniqDefs = Array.from(uniqMap.entries()).map(([term, def]) => ({ term, def }));

  const pickDistractors = (excludeDef: string): string[] => {
    const pool = uniqDefs.map(d => d.def).filter(d => d !== excludeDef);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3);
    while (picked.length < 3) picked.push('A commonly mistaken but incorrect description.');
    return picked;
  };

  const questions: QuizQuestion[] = [];
  if (uniqDefs.length) {
    for (let i = 0; i < Math.min(count, uniqDefs.length); i++) {
      const { term, def } = uniqDefs[i];
      const options = [def, ...pickDistractors(def)].sort(() => Math.random() - 0.5);
      questions.push({
        question: `Which description best matches ${term}?`,
        options,
        answer: def,
      });
    }
  }

  // If not enough definitional pairs, create factual statement checks
  while (questions.length < count) {
    const real = sentences[Math.floor(Math.random() * sentences.length)] || 'This material introduces key concepts.';
    const decoys = [
      real.replace(/\b(is|are)\b/i, 'is not'),
      real.replace(/\b(can|may)\b/i, 'cannot'),
      real.replace(/\b(contains|includes)\b/i, 'excludes'),
    ].map(s => s.length > 160 ? s.slice(0, 160) : s);
    const options = [real, ...decoys].sort(() => Math.random() - 0.5);
    questions.push({
      question: 'Which statement is true based on the materials?',
      options,
      answer: real,
    });
  }

  return questions.slice(0, count);
};

/**
 * Lightweight connectivity check: returns resolved model name if Ollama is reachable.
 */
export const pingOllama = async (): Promise<{ ok: boolean; model?: string; error?: string }> => {
  const preferred = (typeof window !== 'undefined' && localStorage.getItem('ollama:model'))
    || import.meta.env.VITE_OLLAMA_MODEL
    || 'phi3:mini';
  const tagsEndpoints = [
    import.meta.env.VITE_OLLAMA_HOST ? `${import.meta.env.VITE_OLLAMA_HOST}/api/tags` : '/ollama/api/tags',
    'http://localhost:11434/api/tags',
  ];
  try {
    const model = await resolveModel(preferred, tagsEndpoints);
    return { ok: true, model };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) };
  }
};

// Local quick fallback checkpoints generator
const basicCheckpointsFromText = (text: string): Checkpoint[] => {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const candidates: string[] = [];
  for (const line of lines) {
    if (line.length > 15 && /[A-Za-z]/.test(line)) {
      // take a trimmed heading-like snippet
      candidates.push(line.replace(/\s+/g, ' ').slice(0, 60));
    }
    if (candidates.length >= 8) break;
  }
  const uniq = Array.from(new Set(candidates));
  return uniq.slice(0, 6).map((c, idx) => ({ checkpoint: c, order: idx + 1 }));
};

type TagModel = { name: string };
const resolveModel = async (preferred: string, tagsEndpoints: string[]): Promise<string> => {
  let models: string[] = [];
  let lastErr: any = null;
  for (const url of tagsEndpoints) {
    try {
      console.log('[ollama] fetching tags', { url });
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Tags error ${res.status}: ${text}`);
      }
      const json = await res.json();
      const list: TagModel[] = Array.isArray(json) ? json : (json.models || []);
      models = list.map((m: any) => m.name).filter(Boolean);
      break;
    } catch (err) {
      console.warn('[ollama] tags endpoint failed', url, err);
      lastErr = err;
      continue;
    }
  }
  if (!models.length) throw lastErr || new Error('No models available');

  // Require the preferred model explicitly; do not fall back
  if (models.includes(preferred)) return preferred;
  throw new Error(`Preferred Ollama model not available: ${preferred}`);
};