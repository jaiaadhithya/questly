/** Minimal n8n webhook notifier (optional, no-ops if not configured). */
export type N8NEvent = 'study_created' | 'upload_processed' | 'study_generated';

export const notifyN8N = async (event: N8NEvent, payload: Record<string, any>) => {
  const webhook = import.meta.env.VITE_N8N_WEBHOOK_URL;
  if (!webhook) return; // silently skip if not configured
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload }),
    });
  } catch (err) {
    console.warn('n8n webhook failed:', err);
  }
};