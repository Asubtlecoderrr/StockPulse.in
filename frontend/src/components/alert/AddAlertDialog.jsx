import { useState, useEffect } from "react";
import { RefreshCw, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { endpoints } from "@/lib/alertApi";
import Sparkline from "@/components/alert/Sparkline";
import { validateThreshold, toneClass } from "@/lib/thresholdValidator";

const ALERT_TYPES = [
  { id: "below", label: "Price Below", hint: "Alert when price ≤ threshold" },
  { id: "above", label: "Price Above", hint: "Alert when price ≥ threshold" },
  { id: "pct_drop", label: "% Drop", hint: "Alert when price drops X% from add-time" },
];

const formatINR = (n) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

const round2 = (n) => Math.round(n * 100) / 100;

function chipsFor(alertType, q) {
  if (!q) return [];
  const p = q.price;
  if (alertType === "pct_drop") {
    return [
      { label: "3%", value: 3 },
      { label: "5%", value: 5 },
      { label: "10%", value: 10 },
      { label: "15%", value: 15 },
    ];
  }
  if (alertType === "below") {
    return [
      { label: "-3%", value: round2(p * 0.97) },
      { label: "-5%", value: round2(p * 0.95) },
      { label: "-10%", value: round2(p * 0.90) },
      { label: "Day Low", value: q.day_low },
      { label: "30D Low", value: q.range_30d_low },
      { label: "52W Low", value: q.range_52w_low },
    ];
  }
  // above
  return [
    { label: "+3%", value: round2(p * 1.03) },
    { label: "+5%", value: round2(p * 1.05) },
    { label: "+10%", value: round2(p * 1.10) },
    { label: "Day High", value: q.day_high },
    { label: "30D High", value: q.range_30d_high },
    { label: "52W High", value: q.range_52w_high },
  ];
}

function RangeBar({ label, low, high, current }) {
  if (low == null || high == null) return null;
  const range = high - low || 1;
  const pos = current != null ? Math.min(100, Math.max(0, ((current - low) / range) * 100)) : null;
  return (
    <div data-testid={`range-${label.toLowerCase().replace(" ", "-")}`}>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-1">
        <span>{label}</span>
        <span className="font-mono-tab text-gray-400">
          {formatINR(low)} <span className="mx-1 text-gray-300">·</span> {formatINR(high)}
        </span>
      </div>
      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-[#FF3B30]/30 via-gray-200 to-[#00C853]/30" />
        {pos != null ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-[#111827] rounded-full ring-2 ring-white"
            style={{ left: `${pos}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function AddAlertDialog({ open, onOpenChange, stock, onSubmit }) {
  const [alertType, setAlertType] = useState("below");
  const [threshold, setThreshold] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  const loadQuote = async () => {
    if (!stock) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const data = await endpoints.quote(stock.symbol);
      setQuote(data);
    } catch (e) {
      setQuoteError("Could not fetch live price");
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setAlertType("below");
      setThreshold("");
      setSubmitting(false);
      setQuote(null);
      setQuoteError(null);
      return;
    }
    if (stock) loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stock?.symbol]);

  if (!stock) return null;
  const bareSymbol = stock.symbol.replace(".NS", "");
  const dayPositive = (quote?.day_change_pct ?? 0) >= 0;
  const chips = chipsFor(alertType, quote);

  // Smart validation
  const validation = validateThreshold({ alertType, threshold, quote });
  const baseHint = ALERT_TYPES.find((tp) => tp.id === alertType)?.hint;
  const hint = (threshold && quote) ? validation.message : baseHint;
  const hintTone = (threshold && quote) ? toneClass[validation.tone] : "text-gray-500";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tt = parseFloat(threshold);
    if (isNaN(tt) || tt <= 0) return;
    setSubmitting(true);
    await onSubmit({
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange || "NSE",
      alert_type: alertType,
      threshold: tt,
    });
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-white border-gray-200 rounded-sm sm:rounded-sm max-w-lg p-0 overflow-hidden max-h-[92vh] overflow-y-auto"
        data-testid="add-alert-dialog"
      >
        <div className="px-6 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-2">
            New Alert
          </p>
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="font-display text-2xl font-extrabold tracking-tight text-[#111827]">
              {bareSymbol}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {stock.name} · <span className="font-mono-tab text-xs">{stock.exchange || "NSE"}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Live Price + Sparkline */}
          <div className="mt-4 border border-gray-200 rounded-sm bg-gray-50/60 px-4 py-4" data-testid="add-alert-quote">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                  Live Price · 30D Trend
                </span>
                {quoteLoading ? (
                  <span className="font-mono-tab text-xl font-bold text-gray-400 mt-1 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> fetching…
                  </span>
                ) : quoteError ? (
                  <span className="text-xs text-[#FF3B30] mt-1">{quoteError}</span>
                ) : quote ? (
                  <div className="flex items-baseline gap-3 mt-0.5">
                    <span
                      className="font-mono-tab text-2xl font-extrabold tracking-tight text-[#111827]"
                      data-testid="add-alert-current-price"
                    >
                      Rs. {formatINR(quote.price)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-mono-tab font-bold ${
                        dayPositive ? "text-[#00C853]" : "text-[#FF3B30]"
                      }`}
                    >
                      {dayPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {dayPositive ? "+" : ""}{(quote.day_change_pct ?? 0).toFixed(2)}%
                    </span>
                  </div>
                ) : null}
                {quote ? (
                  <span className="text-[10px] font-mono-tab text-gray-400 mt-1">
                    Prev close · Rs. {formatINR(quote.previous_close)}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {quote?.sparkline?.length ? (
                  <Sparkline data={quote.sparkline} width={140} height={48} />
                ) : (
                  <div className="w-[140px] h-[48px]" />
                )}
                <button
                  type="button"
                  onClick={loadQuote}
                  disabled={quoteLoading}
                  className="w-7 h-7 inline-flex items-center justify-center border border-gray-200 rounded-sm bg-white hover:border-[#002FA7] hover:text-[#002FA7] text-gray-500 transition-colors"
                  data-testid="quote-refresh"
                  title="Refresh price"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${quoteLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Range bars */}
            {quote ? (
              <div className="mt-4 space-y-3">
                <RangeBar label="Day Range" low={quote.day_low} high={quote.day_high} current={quote.price} />
                <RangeBar label="30D Range" low={quote.range_30d_low} high={quote.range_30d_high} current={quote.price} />
                <RangeBar label="52W Range" low={quote.range_52w_low} high={quote.range_52w_high} current={quote.price} />
              </div>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 border-t border-gray-100 mt-5">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Alert Type
              </Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {ALERT_TYPES.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => { setAlertType(tp.id); setThreshold(""); }}
                    data-testid={`alert-type-${tp.id}`}
                    className={`px-2 py-3 text-xs font-bold border rounded-sm transition-colors ${
                      alertType === tp.id
                        ? "bg-[#002FA7] text-white border-[#002FA7]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {tp.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="threshold" className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                {alertType === "pct_drop" ? "Drop %" : "Threshold Price (Rs.)"}
              </Label>
              <Input
                id="threshold"
                data-testid="threshold-input"
                type="number"
                step="0.01"
                min="0"
                required
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder={alertType === "pct_drop" ? "5" : "e.g. 2400"}
                className="mt-2 h-11 rounded-sm font-mono-tab text-base border-gray-300 focus-visible:ring-[#002FA7]/20 focus-visible:border-[#002FA7]"
              />

              {/* Quick-pick chips */}
              {chips.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5" data-testid="threshold-chips">
                  <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-gray-400 self-center mr-1">
                    Quick pick
                  </span>
                  {chips.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => setThreshold(String(c.value))}
                      data-testid={`chip-${c.label.replace(/[^a-z0-9]/gi, "")}`}
                      className="px-2.5 py-1 text-[11px] font-mono-tab font-bold bg-white border border-gray-200 rounded-sm hover:border-[#002FA7] hover:text-[#002FA7] transition-colors"
                    >
                      <span className="text-gray-500 mr-1">{c.label}</span>
                      <span className="text-[#111827]">
                        {alertType === "pct_drop" ? `${c.value}%` : formatINR(c.value)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              <p className={`mt-3 text-[11px] font-mono-tab ${hintTone}`} data-testid="threshold-hint">
                {hint}
              </p>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-sm border-gray-300 h-10 px-5 text-xs font-bold uppercase tracking-wider"
              data-testid="add-alert-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !threshold}
              className="rounded-sm bg-[#002FA7] text-white hover:bg-[#002480] h-10 px-5 text-xs font-bold uppercase tracking-wider"
              data-testid="add-alert-submit"
            >
              {submitting ? "Saving…" : "Create Alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
