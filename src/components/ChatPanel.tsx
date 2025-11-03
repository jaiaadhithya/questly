import { useState } from "react";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatPanel = ({ isOpen, onToggle }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your AI learning mentor. Ask me anything about your current topic!" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        role: "assistant",
        content: "That's a great question! Let me help you understand that better..."
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setInput("");
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          size="lg"
          className="fixed bottom-8 right-8 rounded-full w-16 h-16 gradient-primary shadow-2xl hover:scale-110 transition-transform animate-float z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-screen w-full md:w-[400px] bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl z-50 flex flex-col animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border gradient-primary">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">AI Mentor</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="hover:bg-background/50"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-background border-border"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="gradient-secondary hover:scale-105 transition-transform"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPanel;
