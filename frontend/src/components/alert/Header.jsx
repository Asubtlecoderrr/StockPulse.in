import { useEffect, useState } from "react";
import { RefreshCw, Activity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function fmtIstTime(iso) {
  if (!iso) return "--:--:--";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

export default function Header({ marketStatus, onRefresh, refreshing, aiHealth }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isOpen = !!marketStatus?.is_open;
  const weekday = marketStatus?.weekday;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200" data-testid="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3" data-testid="brand">
          <div className="w-8 h-8 bg-[#002FA7] flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-extrabold tracking-tighter text-[#111827]">
              STOCKPULSE
            </span>
            <span className="font-display text-xs font-bold text-[#FF3B30] tracking-[0.2em]">.IN</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div
            className="hidden sm:flex items-center gap-2 text-xs font-mono-tab text-gray-600"
            data-testid="ist-clock"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">IST</span>
            <span className="tabular-nums">
              {now.toLocaleTimeString("en-IN", {
                hour: "2-digit", minute: "2-digit", second: "2-digit",
                hour12: false, timeZone: "Asia/Kolkata",
              })}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold tracking-wider uppercase border ${
              isOpen
                ? "bg-[#F0FDF4] text-[#00C853] border-[#00C853]/30"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
            data-testid="market-status-pill"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOpen ? "bg-[#00C853] live-dot" : "bg-gray-400"
              }`}
            />
            {isOpen ? "Market Open" : "Market Closed"}
            {weekday ? <span className="hidden md:inline text-[10px] text-gray-400 font-mono-tab">· {weekday.slice(0,3).toUpperCase()}</span> : null}
          </div>

          {aiHealth ? (
            <div
              className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase border ${
                aiHealth.reachable && aiHealth.model_ready
                  ? "bg-[#002FA7]/5 text-[#002FA7] border-[#002FA7]/30"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}
              data-testid="ai-status-pill"
              title={aiHealth.reachable && aiHealth.model_ready ? `AI ready · ${aiHealth.model}` : `AI offline · ${aiHealth.reason || "model not pulled"}`}
            >
              <Sparkles className="w-3 h-3" strokeWidth={2.5} />
              {aiHealth.reachable && aiHealth.model_ready ? "AI" : "AI Off"}
            </div>
          ) : null}

          <Button
            onClick={onRefresh}
            disabled={refreshing}
            className="bg-[#002FA7] text-white hover:bg-[#002480] rounded-sm h-9 px-4 text-xs font-bold tracking-wider uppercase"
            data-testid="refresh-prices-button"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>
    </header>
  );
}
