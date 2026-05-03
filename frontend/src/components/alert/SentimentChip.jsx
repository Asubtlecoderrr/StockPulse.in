import { useEffect, useState } from "react";
import { endpoints } from "@/lib/alertApi";

const COLOR = {
  green: { dot: "bg-[#00C853]", ring: "border-[#00C853]/40", text: "text-[#00C853]" },
  red: { dot: "bg-[#FF3B30]", ring: "border-[#FF3B30]/40", text: "text-[#FF3B30]" },
  yellow: { dot: "bg-[#FFCC00]", ring: "border-[#FFCC00]/60", text: "text-[#b58500]" },
};

const LABEL = {
  green: "POS",
  red: "NEG",
  yellow: "NEU",
};

export default function SentimentChip({ symbol, aiOk }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  const load = async () => {
    if (!aiOk) return;
    setLoading(true);
    try {
      const r = await endpoints.sentiment(symbol);
      setData(r);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aiOk) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, aiOk]);

  if (!aiOk) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-1.5 py-0.5 border border-gray-200 bg-gray-50 rounded-sm text-[10px] font-mono-tab text-gray-400"
        title="AI offline"
        data-testid={`sentiment-offline-${symbol}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        AI
      </span>
    );
  }

  if (loading || !data) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-1.5 py-0.5 border border-gray-200 bg-white rounded-sm text-[10px] font-mono-tab text-gray-400 animate-pulse"
        data-testid={`sentiment-loading-${symbol}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        ···
      </span>
    );
  }

  const palette = COLOR[data.sentiment] || COLOR.yellow;
  const label = LABEL[data.sentiment] || "NEU";

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-testid={`sentiment-chip-${symbol}`}
    >
      <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 border ${palette.ring} bg-white rounded-sm text-[10px] font-mono-tab font-bold ${palette.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${palette.dot}`} />
        {label}
      </span>
      {hover && data.summary ? (
        <div className="absolute z-30 right-0 mt-1.5 w-64 px-3 py-2 bg-[#111827] text-white rounded-sm shadow-lg text-[11px] leading-relaxed">
          {data.summary}
          {data.headlines?.length ? (
            <ul className="mt-1.5 pt-1.5 border-t border-white/10 space-y-0.5">
              {data.headlines.slice(0, 2).map((h, i) => (
                <li key={i} className="text-white/60 text-[10px] truncate">· {h}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
