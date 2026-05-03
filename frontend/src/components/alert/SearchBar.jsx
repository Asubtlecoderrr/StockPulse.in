import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { endpoints } from "@/lib/alertApi";
import AddAlertDialog from "@/components/alert/AddAlertDialog";

export default function SearchBar({ onAdd }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let active = true;
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await endpoints.search(q.trim());
        if (active) setResults(data.results || []);
      } finally {
        if (active) setLoading(false);
      }
    }, 180);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  const pick = (item) => {
    setSelected(item);
    setDialogOpen(true);
    setOpen(false);
    setQ("");
    setResults([]);
  };

  const submitAdd = async (payload) => {
    await onAdd(payload);
    setDialogOpen(false);
    setSelected(null);
  };

  const showDropdown = open && (q.trim().length > 0);

  return (
    <div className="relative" ref={wrapRef} data-testid="search-wrapper">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          / Add New Alert
        </p>
        <p className="text-[10px] font-mono-tab text-gray-400">
          Search 170+ NSE equities & ETFs
        </p>
      </div>
      <div className="flex items-stretch border border-gray-300 bg-white rounded-sm focus-within:border-[#002FA7] transition-colors">
        <div className="flex items-center pl-4 text-gray-500">
          <Search className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <input
          data-testid="stock-search-input"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search Reliance, HDFC, NIFTYBEES, TCS…"
          className="flex-1 px-3 py-4 bg-transparent text-base font-mono-tab outline-none placeholder:text-gray-400"
        />
        {loading ? (
          <div className="flex items-center pr-4 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : null}
      </div>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 mt-1 max-h-80 overflow-y-auto nice-scroll bg-white border border-gray-200 z-30"
          data-testid="search-results-dropdown"
        >
          {results.length === 0 && !loading ? (
            <div className="px-4 py-6 text-sm text-gray-500">
              No matches. Try a symbol like <span className="font-mono-tab">TCS</span> or a company name.
            </div>
          ) : (
            results.map((item) => (
              <button
                type="button"
                key={item.symbol}
                onClick={() => pick(item)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                data-testid={`search-result-${item.symbol.replace(".NS","")}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono-tab text-sm font-bold text-[#111827] w-28 truncate">
                    {item.symbol.replace(".NS","")}
                  </span>
                  <span className="text-sm text-gray-600 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-mono-tab uppercase tracking-wider ${item.type === "ETF" ? "text-[#002FA7]" : "text-gray-500"}`}>
                    {item.type}
                  </span>
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))
          )}
        </div>
      )}

      <AddAlertDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setSelected(null); }}
        stock={selected}
        onSubmit={submitAdd}
      />
    </div>
  );
}
