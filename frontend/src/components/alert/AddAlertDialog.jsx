import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ALERT_TYPES = [
  { id: "below", label: "Price Below", hint: "Alert when price <= threshold" },
  { id: "above", label: "Price Above", hint: "Alert when price >= threshold" },
  { id: "pct_drop", label: "% Drop", hint: "Alert when price drops X% from add-time" },
];

export default function AddAlertDialog({ open, onOpenChange, stock, onSubmit }) {
  const [alertType, setAlertType] = useState("below");
  const [threshold, setThreshold] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setAlertType("below");
      setThreshold("");
      setSubmitting(false);
    }
  }, [open]);

  if (!stock) return null;
  const bareSymbol = stock.symbol.replace(".NS", "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t = parseFloat(threshold);
    if (isNaN(t) || t <= 0) return;
    setSubmitting(true);
    await onSubmit({
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange || "NSE",
      alert_type: alertType,
      threshold: t,
    });
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 rounded-sm sm:rounded-sm max-w-md p-0 overflow-hidden" data-testid="add-alert-dialog">
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
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 border-t border-gray-100 mt-4">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Alert Type
              </Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {ALERT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAlertType(t.id)}
                    data-testid={`alert-type-${t.id}`}
                    className={`px-2 py-3 text-xs font-bold border rounded-sm transition-colors ${
                      alertType === t.id
                        ? "bg-[#002FA7] text-white border-[#002FA7]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-gray-500 font-mono-tab">
                {ALERT_TYPES.find((t) => t.id === alertType)?.hint}
              </p>
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
