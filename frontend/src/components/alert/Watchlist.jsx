import { useEffect, useRef, useState } from "react";
import { Trash2, Pencil, Check, X, BellRing, TrendingDown, TrendingUp, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { validateThreshold, toneClass, tonePillClass } from "@/lib/thresholdValidator";

const formatINR = (n) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

const typeMeta = {
  below: { label: "Below", Icon: TrendingDown, color: "text-[#FF3B30]" },
  above: { label: "Above", Icon: TrendingUp, color: "text-[#00C853]" },
  pct_drop: { label: "% Drop", Icon: Percent, color: "text-[#002FA7]" },
};

function PriceCell({ item }) {
  const prev = useRef(item.current_price);
  const [flash, setFlash] = useState(null);
  useEffect(() => {
    if (item.current_price == null) return;
    if (prev.current != null && item.current_price !== prev.current) {
      setFlash(item.current_price > prev.current ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 900);
      prev.current = item.current_price;
      return () => clearTimeout(t);
    }
    prev.current = item.current_price;
  }, [item.current_price]);

  const changePct = item.day_change_pct;
  const positive = (changePct ?? 0) >= 0;
  return (
    <div className={`flex flex-col items-end ${flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : ""}`} data-testid={`price-cell-${item.symbol}`}>
      <span className="font-mono-tab text-base font-bold text-[#111827]">
        {item.current_price != null ? `Rs. ${formatINR(item.current_price)}` : "—"}
      </span>
      {changePct != null ? (
        <span className={`text-[11px] font-mono-tab mt-0.5 ${positive ? "text-[#00C853]" : "text-[#FF3B30]"}`}>
          {positive ? "+" : ""}{changePct.toFixed(2)}%
        </span>
      ) : null}
    </div>
  );
}

function Row({ item, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [threshold, setThreshold] = useState(String(item.threshold));
  const [alertType, setAlertType] = useState(item.alert_type);

  useEffect(() => {
    if (!editing) {
      setThreshold(String(item.threshold));
      setAlertType(item.alert_type);
    }
  }, [editing, item]);

  const meta = typeMeta[item.alert_type];
  const bareSymbol = item.symbol.replace(".NS", "").replace(".BO", "");

  // Distance-to-trigger (always-visible, computed from current price)
  const minimalQuote = item.current_price != null ? { price: item.current_price } : null;
  const liveDistance = validateThreshold({
    alertType: item.alert_type,
    threshold: item.threshold,
    quote: minimalQuote,
    referencePrice: item.reference_price,
  });
  const distancePill = (minimalQuote && liveDistance.distanceLabel)
    ? { label: liveDistance.distanceLabel, tone: liveDistance.tone }
    : null;

  // Edit-mode validation hint
  const editValidation = editing
    ? validateThreshold({
        alertType,
        threshold,
        quote: minimalQuote,
        referencePrice: item.reference_price,
      })
    : null;

  const save = async () => {
    const t = parseFloat(threshold);
    if (isNaN(t) || t <= 0) return;
    await onUpdate(item.id, { threshold: t, alert_type: alertType });
    setEditing(false);
  };

  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors"
      data-testid={`watchlist-row-${bareSymbol}`}
    >
      <td className="py-4 pr-4">
        <div className="flex flex-col">
          <span className="font-mono-tab font-bold text-sm text-[#111827]">{bareSymbol}</span>
          <span className="text-xs text-gray-500 truncate max-w-[220px]">{item.name}</span>
        </div>
      </td>
      <td className="py-4 px-3 text-right">
        <PriceCell item={item} />
      </td>
      <td className="py-4 px-3">
        {editing ? (
          <Select value={alertType} onValueChange={setAlertType}>
            <SelectTrigger
              className="h-9 w-[132px] rounded-sm border-gray-300 text-xs font-mono-tab"
              data-testid={`edit-type-${bareSymbol}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="below">Price Below</SelectItem>
              <SelectItem value="above">Price Above</SelectItem>
              <SelectItem value="pct_drop">% Drop</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className={`inline-flex items-center gap-1.5 text-xs font-bold ${meta.color}`}>
            <meta.Icon className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="uppercase tracking-wider">{meta.label}</span>
          </div>
        )}
      </td>
      <td className="py-4 px-3 text-right">
        {editing ? (
          <div className="flex flex-col items-end gap-1">
            <Input
              data-testid={`edit-threshold-${bareSymbol}`}
              type="number"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="h-9 w-28 text-right rounded-sm border-gray-300 font-mono-tab text-sm"
            />
            {editValidation?.message ? (
              <span
                className={`text-[10px] font-mono-tab text-right max-w-[180px] ${toneClass[editValidation.tone]}`}
                data-testid={`edit-hint-${bareSymbol}`}
              >
                {editValidation.message}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="font-mono-tab text-sm">
            {item.alert_type === "pct_drop" ? `${item.threshold}%` : `Rs. ${formatINR(item.threshold)}`}
          </span>
        )}
      </td>
      <td className="py-4 px-3 text-right">
        {item.triggered ? (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#FEF2F2] text-[#FF3B30] border border-[#FF3B30]/30 rounded-sm text-[10px] font-bold uppercase tracking-wider"
            data-testid={`status-triggered-${bareSymbol}`}
          >
            <BellRing className="w-3 h-3" /> Triggered
          </span>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#F0FDF4] text-[#00C853] border border-[#00C853]/30 rounded-sm text-[10px] font-bold uppercase tracking-wider"
              data-testid={`status-armed-${bareSymbol}`}
            >
              <span className="w-1.5 h-1.5 bg-[#00C853] rounded-full" /> Armed
            </span>
            {distancePill ? (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-sm border text-[10px] font-mono-tab font-bold tracking-tight ${tonePillClass[distancePill.tone]}`}
                data-testid={`distance-pill-${bareSymbol}`}
                title="Distance to alert trigger"
              >
                {distancePill.label}
              </span>
            ) : null}
          </div>
        )}
      </td>
      <td className="py-4 pl-3">
        <div className="flex items-center justify-end gap-1">
          {editing ? (
            <>
              <Button
                size="sm" variant="ghost"
                onClick={save}
                className="h-8 w-8 p-0 text-[#00C853] hover:bg-[#F0FDF4] rounded-sm"
                data-testid={`save-row-${bareSymbol}`}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm" variant="ghost"
                onClick={() => setEditing(false)}
                className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 rounded-sm"
                data-testid={`cancel-row-${bareSymbol}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm" variant="ghost"
                onClick={() => setEditing(true)}
                className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 rounded-sm"
                data-testid={`edit-row-${bareSymbol}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm" variant="ghost"
                onClick={() => onDelete(item.id)}
                className="h-8 w-8 p-0 text-[#FF3B30] hover:bg-[#FEF2F2] rounded-sm"
                data-testid={`delete-row-${bareSymbol}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function Watchlist({ items, onUpdate, onDelete }) {
  if (!items || items.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-sm p-10 text-center" data-testid="watchlist-empty">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">No Alerts Yet</p>
        <p className="mt-3 font-display text-2xl font-bold text-[#111827]">Your watchlist is empty.</p>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Search a stock or ETF above and set a threshold — we'll watch the rest.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-sm bg-white overflow-hidden" data-testid="watchlist-container">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50/60">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          / Watchlist
        </p>
        <p className="text-[10px] font-mono-tab text-gray-500">
          {items.length} {items.length === 1 ? "alert" : "alerts"}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left" data-testid="watchlist-table">
          <thead>
            <tr className="bg-white">
              <th className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 py-3 px-4 border-b border-gray-200">Symbol</th>
              <th className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 py-3 px-3 border-b border-gray-200 text-right">Last Price</th>
              <th className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 py-3 px-3 border-b border-gray-200">Type</th>
              <th className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 py-3 px-3 border-b border-gray-200 text-right">Threshold</th>
              <th className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 py-3 px-3 border-b border-gray-200 text-right">Status</th>
              <th className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 py-3 px-4 border-b border-gray-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <Row key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
