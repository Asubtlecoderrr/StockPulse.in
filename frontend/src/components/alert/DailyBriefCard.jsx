import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { endpoints } from "@/lib/alertApi";
import { toast } from "sonner";

export default function DailyBriefCard({ aiHealth }) {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const reachable = !!aiHealth?.reachable && !!aiHealth?.model_ready;

  const loadLatest = async () => {
    setLoading(true);
    try {
      const list = await endpoints.briefs(1);
      setLatest(list?.[0] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatest();
  }, []);

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const res = await endpoints.briefPreview();
      setLatest({ text: res.text, created_at: new Date().toISOString(), watchlist_count: res.watchlist_count, alerts_today: res.alerts_today });
      toast.success("Daily brief generated");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI unavailable. Is Ollama running?");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-sm bg-white" data-testid="daily-brief-card">
      <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-gray-100">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 flex items-center justify-center bg-[#002FA7]/5 border border-[#002FA7]/30 rounded-sm flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#002FA7]" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
              AI Daily Brief · 15:35 IST · Llama
            </p>
            <p className="font-display text-base font-bold tracking-tight text-[#111827]">
              {latest ? "Today's market read" : "No brief yet — generate one now."}
            </p>
          </div>
        </div>
        <Button
          onClick={onGenerate}
          disabled={!reachable || generating}
          className="h-9 px-3 rounded-sm bg-[#002FA7] text-white hover:bg-[#002480] text-xs font-bold uppercase tracking-wider flex-shrink-0"
          data-testid="brief-generate-button"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
          {generating ? "Thinking" : "Generate"}
        </Button>
      </div>
      <div className="px-5 py-4">
        {!reachable ? (
          <p className="text-xs text-[#b58500] font-mono-tab" data-testid="brief-ai-offline">
            Ollama is offline — start it locally with{" "}
            <span className="bg-gray-100 px-1.5 py-0.5 rounded-sm">ollama serve</span> and pull{" "}
            <span className="bg-gray-100 px-1.5 py-0.5 rounded-sm">{aiHealth?.model || "llama3.1:8b"}</span>.
          </p>
        ) : loading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : latest ? (
          <div data-testid="brief-text">
            <p className="text-sm text-[#111827] whitespace-pre-line leading-relaxed">{latest.text}</p>
            <p className="mt-3 text-[10px] font-mono-tab text-gray-400">
              {new Date(latest.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
              {latest.alerts_today != null ? ` · ${latest.alerts_today} alerts today` : ""}
              {latest.watchlist_count != null ? ` · ${latest.watchlist_count} on watchlist` : ""}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Click Generate to create your first brief from the current watchlist.</p>
        )}
      </div>
    </div>
  );
}
