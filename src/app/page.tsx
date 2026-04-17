"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Languages, 
  ShieldCheck, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Stethoscope,
  BrainCircuit,
  Lightbulb,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { VoiceInput } from "@/components/VoiceInput";
import { ImageUpload } from "@/components/ImageUpload";

// Types
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
  traces?: any[];
  risk?: "Low" | "Medium" | "High";
  symptoms?: string[];
  tips?: string[];
}

export default function MediFusionApp() {
  const [input, setInput] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello, I am MediFusion — your AI health guide. I can analyze your symptoms and even images. Describe how you feel, or upload a photo of a rash or injury.",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if ((!input.trim() && !imageData) || isLoading) return;

    const currentImg = imageData;
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      content: input,
      imagePreview: currentImg || undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setInput("");
    setImageData(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input, 
          language, 
          imageData: currentImg 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reach swarm");

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.finalOutput || "Based on your symptoms, here is my analysis.",
        traces: data.reasoningTrace,
        risk: data.riskLevel,
        symptoms: data.symptoms,
        tips: data.homeCareTips,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: `⚠️ Error: ${err.message}. Please check your API key or network connection.`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFEFE] dark:bg-[#0B1215] text-slate-900 dark:text-slate-100 font-sans">
      {/* Premium Header */}
      <header className="px-6 py-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
            <Activity size={22} strokeWidth={2.5} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              MediFusion
              <Badge variant="outline" className="text-[10px] uppercase tracking-tighter border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">Alpha 1.0</Badge>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest leading-none">Global Swarm Intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLanguage(l => l === "en" ? "hi" : "en")}
            className="rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-600 dark:text-slate-400 transition-all font-medium border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
          >
            <Languages size={16} className="mr-2 text-emerald-500" />
            {language === "en" ? "English" : "हिंदी"}
          </Button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 pt-8 pb-40 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={cn("flex flex-col group", m.role === "user" ? "items-end" : "items-start")}
              >
                {/* Image Preview (user messages) */}
                {m.imagePreview && (
                  <div className="mb-2 rounded-2xl overflow-hidden size-28 shadow-lg border border-slate-200 dark:border-slate-700">
                    <img src={m.imagePreview} alt="Uploaded" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Message Bubble */}
                <div className={cn(
                  "relative max-w-[85%] px-5 py-4 rounded-[2rem] shadow-sm transition-all duration-300",
                  m.role === "user" 
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-br-none shadow-xl shadow-slate-200 dark:shadow-none" 
                    : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-bl-none"
                )}>
                  <p className="text-[15px] leading-[1.6] whitespace-pre-wrap font-medium">{m.content}</p>
                  
                  {/* Risk + Symptoms chips */}
                  {m.role === "assistant" && (m.risk || (m.symptoms && m.symptoms.length > 0)) && (
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex flex-wrap gap-2">
                       {m.risk && (
                         <div className={cn(
                           "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
                           m.risk === "High" ? "bg-red-50 text-red-600 border border-red-100" :
                           m.risk === "Medium" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                           "bg-blue-50 text-blue-600 border border-blue-100"
                         )}>
                           <AlertTriangle size={12} />
                           {m.risk} Risk
                         </div>
                       )}
                       {m.symptoms?.slice(0, 3).map((s, i) => (
                         <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px] font-medium border border-slate-100 dark:border-slate-700">
                           <Stethoscope size={10} />
                           {s}
                         </div>
                       ))}
                    </div>
                  )}

                  {/* Home Care Tips */}
                  {m.role === "assistant" && m.tips && m.tips.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Lightbulb size={11} className="text-amber-500" />
                        Home Care Tips
                      </p>
                      <ul className="space-y-1">
                        {m.tips.map((tip, i) => (
                          <li key={i} className="text-[12px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                            <Zap size={10} className="text-emerald-500 mt-1 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Agent Swarm Trace Visualizer */}
                {m.role === "assistant" && m.traces && m.traces.length > 0 && (
                  <div className="mt-4 w-full max-w-lg ml-2">
                     <button 
                       onClick={() => setActiveTraceId(activeTraceId === m.id ? null : m.id)}
                       className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-emerald-500 uppercase tracking-widest transition-colors"
                     >
                       {activeTraceId === m.id 
                         ? <ChevronUp size={14}/> 
                         : <BrainCircuit size={14} className="text-emerald-500 animate-float"/>
                       }
                       {activeTraceId === m.id ? "Minimize Swarm Trace" : "Verify Swarm Reasoning"}
                     </button>

                     <AnimatePresence>
                       {activeTraceId === m.id && (
                         <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: "auto", opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="mt-3 overflow-hidden"
                         >
                           <div className="glass-card rounded-[1.5rem] p-5 space-y-4 border-emerald-500/10">
                             <div className="flex items-center gap-2 mb-2">
                               <Activity size={14} className="text-emerald-500 animate-pulse"/>
                               <span className="text-[10px] font-bold uppercase text-slate-500">Processing Audit</span>
                             </div>
                             {m.traces.map((t, idx) => (
                               <motion.div 
                                 key={idx}
                                 initial={{ x: -10, opacity: 0 }}
                                 animate={{ x: 0, opacity: 1 }}
                                 transition={{ delay: idx * 0.1 }}
                                 className="relative pl-6 pb-4 last:pb-0 border-l border-emerald-500/20"
                               >
                                 <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                 <h4 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">{t.agentName}</h4>
                                 <p className="text-[12px] text-slate-500 dark:text-slate-400 italic leading-snug">{t.thought}</p>
                               </motion.div>
                             ))}
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 items-start"
            >
              <div className="flex gap-2 items-center">
                <div className="size-2 bg-emerald-500 rounded-full animate-bounce" />
                <div className="size-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="size-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2">Agents are collaborating...</span>
              </div>
              <Skeleton className="h-20 w-3/4 rounded-[2rem] rounded-bl-none opacity-50" />
            </motion.div>
          )}
          
          {/* Disclaimer */}
          <div className="mt-12 p-6 glass rounded-[2rem] border-amber-500/10 flex gap-4">
             <div className="size-10 bg-emerald-100 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={24} />
             </div>
             <div>
               <h5 className="text-xs font-bold uppercase tracking-wide mb-1 text-emerald-800 dark:text-emerald-300 opacity-80">Safety First</h5>
               <p className="text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                 <strong>LEGAL NOTICE:</strong> MediFusion is an informational experimental AI swarm. It does NOT provide clinical diagnoses or medical advice. Always consult a licensed doctor for any health concerns or emergencies.
               </p>
             </div>
          </div>

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Floating Input Area */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-3xl mx-auto"
        >
          <div className="glass-card p-2 rounded-[2.5rem] flex items-center gap-2 group focus-within:ring-2 ring-emerald-500/20 transition-all shadow-2xl">
            <div className="flex items-center gap-1 pl-2">
              <ImageUpload onImageSelect={setImageData} hasImage={!!imageData} />
              <VoiceInput 
                onTranscript={(text: string) => setInput(text)} 
                language={language} 
              />
            </div>
            
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={language === "en" ? "Describe your symptoms..." : "अपने लक्षण बताएं..."}
              className="bg-transparent border-none focus-visible:ring-0 text-base shadow-none h-12 flex-1 font-medium placeholder:text-slate-400"
            />
            
            <Button 
              onClick={handleSend}
              disabled={(!input.trim() && !imageData) || isLoading}
              className={cn(
                "rounded-full size-12 shadow-lg transition-all active:scale-95 px-0",
                input.trim() || imageData ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-100 text-slate-300 dark:bg-slate-800"
              )}
            >
              <Send size={20} className={cn(isLoading && "animate-pulse")} />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
