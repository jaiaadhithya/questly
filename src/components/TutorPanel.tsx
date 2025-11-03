import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles } from "lucide-react";
import { localStore } from "@/lib/localStore";
import { generateTutorReply, TutorMessage } from "@/lib/gemini";
// TTS removed: no synthesizeTTS or toast needed

interface TutorPanelProps {
  topicTitle: string;
  studyId?: string | null;
}

const PERSONA_OPTIONS = [
  "Encouraging Coach",
  "Socratic Mentor",
  "Concise Expert",
  "Patient Explainer",
  "Playful Buddy",
];

const TutorPanel = ({ topicTitle, studyId }: TutorPanelProps) => {
  const [persona, setPersona] = useState<string>(PERSONA_OPTIONS[0]);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // TTS removed: no audio state/refs

  // Load saved persona from local store if available
  useEffect(() => {
    if (!studyId) return;
    const topics = localStore.getTopics(studyId) || [];
    const idx = topics.findIndex(t => t.checkpoint_name === topicTitle);
    const saved = idx !== -1 ? topics[idx]?.tutor_persona ?? null : null;
    if (saved) setPersona(saved);
  }, [studyId, topicTitle]);

  // Persist persona selection
  const persistPersona = (next: string) => {
    setPersona(next);
    if (!studyId) return;
    const topics = localStore.getTopics(studyId) || [];
    const idx = topics.findIndex(t => t.checkpoint_name === topicTitle);
    if (idx !== -1) {
      topics[idx] = { ...topics[idx], tutor_persona: next };
      localStore.setTopics(studyId, topics);
    }
  };

  // Initial greeting when persona/topic changes
  useEffect(() => {
    const greeting: TutorMessage = {
      role: "assistant",
      content: `Hi! I’m your ${persona.toLowerCase()}. Let’s learn ${topicTitle}. What would you like help with?`,
    };
    setMessages([greeting]);
  }, [persona, topicTitle]);

  // TTS removed: no auto-synthesis of assistant replies

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: TutorMessage = { role: "user", content: text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);
    try {
      const reply = await generateTutorReply(topicTitle, persona, nextHistory, text);
      const aiMsg: TutorMessage = { role: "assistant", content: reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const errMsg: TutorMessage = { role: "assistant", content: "I ran into an issue generating a reply. Please try again." };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const headerTitle = useMemo(() => `Agentic Tutor`, []);

  return (
    <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold">{headerTitle}</h3>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs text-slate-500 dark:text-slate-400">Personality</Label>
          <Select value={persona} onValueChange={persistPersona}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select personality" />
            </SelectTrigger>
            <SelectContent>
              {PERSONA_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-3">
        <ScrollArea className="h-56 rounded-md border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-800/30">
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-slate-500 dark:text-slate-400">Thinking…</div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${topicTitle}…`}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4 mr-1" />
            Send
          </Button>
        </div>
        {/* TTS removed */}
      </div>
    </Card>
  );
};

export default TutorPanel;