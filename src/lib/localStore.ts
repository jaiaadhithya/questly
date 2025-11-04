// Lightweight local storage helpers for running the app without Supabase

export type LocalStudy = {
  id: string;
  name: string;
  status: 'in_progress' | 'completed';
  progress: number;
  created_at: string;
  // Whether the initial skill assessment quiz has been completed
  assessment_completed?: boolean;
  // Track resume point within roadmap
  last_checkpoint_title?: string;
  last_opened_at?: string;
};

export type LocalUpload = {
  file_name: string;
  file_type: 'slide' | 'pqp';
  file_url: string;
  upload_date: string;
};

export type LocalQuizItem = {
  question: string;
  options: string[];
  answer: string;
};

export type LocalTopic = {
  checkpoint_name: string;
  order: number;
  video_url?: string | null;
  // Persist per-topic tutor persona selection
  tutor_persona?: string | null;
  // Persist mini quiz items for this topic (single-question by default)
  quiz_items?: LocalQuizItem[];
  // Mark checkpoint completion
  completed?: boolean;
};

const key = (k: string) => `local:${k}`;

const readJSON = <T>(k: string, def: T): T => {
  try {
    const raw = localStorage.getItem(key(k));
    if (!raw) return def;
    return JSON.parse(raw) as T;
  } catch {
    return def;
  }
};

const writeJSON = (k: string, val: any) => {
  try {
    localStorage.setItem(key(k), JSON.stringify(val));
  } catch {}
};

const uuid = () => {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
};

export const localStore = {
  getStudies(): LocalStudy[] {
    return readJSON<LocalStudy[]>('studies', []);
  },
  getStudy(id: string): LocalStudy | null {
    const studies = readJSON<LocalStudy[]>('studies', []);
    return studies.find(s => s.id === id) || null;
  },
  createStudy(name?: string): LocalStudy {
    const studies = readJSON<LocalStudy[]>('studies', []);
    const study: LocalStudy = {
      id: uuid(),
      name: name || `Study ${new Date().toLocaleDateString()}`,
      status: 'in_progress',
      progress: 0,
      created_at: new Date().toISOString(),
    };
    studies.unshift(study);
    writeJSON('studies', studies);
    return study;
  },

  updateStudy(id: string, updates: Partial<LocalStudy>) {
    const studies = readJSON<LocalStudy[]>('studies', []);
    const next = studies.map(s => s.id === id ? { ...s, ...updates } : s);
    writeJSON('studies', next);
  },

  deleteStudy(id: string) {
    // Remove study from list
    const studies = readJSON<LocalStudy[]>('studies', []);
    const next = studies.filter(s => s.id !== id);
    writeJSON('studies', next);

    // Clean up associated local data
    try { localStorage.removeItem(key(`uploads:${id}`)); } catch {}
    try { localStorage.removeItem(key(`quiz:${id}`)); } catch {}
    try { localStorage.removeItem(key(`topics:${id}`)); } catch {}
  },

  addUpload(studyId: string, upload: LocalUpload) {
    const uploads = readJSON<LocalUpload[]>(`uploads:${studyId}`, []);
    uploads.push(upload);
    writeJSON(`uploads:${studyId}`, uploads);
  },

  setQuiz(studyId: string, items: LocalQuizItem[]) {
    writeJSON(`quiz:${studyId}`, items);
  },

  getQuiz(studyId: string): LocalQuizItem[] {
    return readJSON<LocalQuizItem[]>(`quiz:${studyId}`, []);
  },

  setTopics(studyId: string, topics: LocalTopic[]) {
    writeJSON(`topics:${studyId}`, topics);
  },
  getTopics(studyId: string): LocalTopic[] {
    return readJSON<LocalTopic[]>(`topics:${studyId}`, []);
  },

  setTopicQuiz(studyId: string, checkpointTitle: string, items: LocalQuizItem[]) {
    const topics = readJSON<LocalTopic[]>(`topics:${studyId}`, []);
    const idx = topics.findIndex(t => t.checkpoint_name === checkpointTitle);
    if (idx === -1) return;
    const updated = { ...topics[idx], quiz_items: items } as LocalTopic;
    topics[idx] = updated;
    writeJSON(`topics:${studyId}`, topics);
  },

  getTopicQuiz(studyId: string, checkpointTitle: string): LocalQuizItem[] {
    const topics = readJSON<LocalTopic[]>(`topics:${studyId}`, []);
    const t = topics.find(x => x.checkpoint_name === checkpointTitle);
    return t?.quiz_items || [];
  },
};