/**
 * Smart threshold validator + distance helpers.
 *
 * Inputs:
 *   alertType: "below" | "above" | "pct_drop"
 *   threshold: number  (price for below/above, % for pct_drop)
 *   quote:    { price, range_30d_low, range_30d_high, range_52w_low, range_52w_high }
 *   referencePrice: number (only for pct_drop) — the price at which alert was created
 *
 * Outputs:
 *   { tone, message, distancePct, willFireNow, distanceLabel }
 *     tone: "ok" | "warn" | "danger" | "fires"
 *     distancePct: % away from triggering (positive = safe, negative = past trigger)
 *     willFireNow: boolean
 */
const fmt = (n) => Number(n).toFixed(2);
const fmtPct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

export function validateThreshold({ alertType, threshold, quote, referencePrice }) {
  const t = parseFloat(threshold);
  if (!quote || isNaN(t) || t <= 0) {
    return { tone: "ok", message: "", distancePct: null, willFireNow: false, distanceLabel: "" };
  }
  const price = quote.price;

  if (alertType === "below") {
    const distance = ((price - t) / price) * 100; // +ve means price still above threshold
    const willFire = price <= t;
    let tone = "ok";
    let message = `Distance to trigger · ${fmtPct(-Math.abs(distance))} (price needs to drop ${distance.toFixed(2)}%).`;
    if (willFire) {
      tone = "fires";
      message = `Threshold ≥ current price — alert will fire immediately.`;
    } else if (quote.range_52w_low != null && t < quote.range_52w_low) {
      tone = "danger";
      message = `Threshold (₹${fmt(t)}) is below 52W low (₹${fmt(quote.range_52w_low)}) — may rarely trigger.`;
    } else if (quote.range_30d_low != null && t < quote.range_30d_low * 0.95) {
      tone = "warn";
      message = `Threshold is well below 30D low (₹${fmt(quote.range_30d_low)}) — may take a deep correction.`;
    }
    return { tone, message, distancePct: distance, willFireNow: willFire, distanceLabel: willFire ? "FIRES" : `−${distance.toFixed(2)}%` };
  }

  if (alertType === "above") {
    const distance = ((t - price) / price) * 100;
    const willFire = price >= t;
    let tone = "ok";
    let message = `Distance to trigger · +${distance.toFixed(2)}% (price needs to rise ${distance.toFixed(2)}%).`;
    if (willFire) {
      tone = "fires";
      message = `Threshold ≤ current price — alert will fire immediately.`;
    } else if (quote.range_52w_high != null && t > quote.range_52w_high) {
      tone = "danger";
      message = `Threshold (₹${fmt(t)}) is above 52W high (₹${fmt(quote.range_52w_high)}) — may rarely trigger.`;
    } else if (quote.range_30d_high != null && t > quote.range_30d_high * 1.05) {
      tone = "warn";
      message = `Threshold is well above 30D high (₹${fmt(quote.range_30d_high)}) — may take a strong rally.`;
    }
    return { tone, message, distancePct: distance, willFireNow: willFire, distanceLabel: willFire ? "FIRES" : `+${distance.toFixed(2)}%` };
  }

  if (alertType === "pct_drop") {
    const ref = referencePrice ?? price;
    const dropFromRef = ((ref - price) / ref) * 100; // current drop %
    const distance = t - dropFromRef; // remaining drop% to trigger
    const willFire = dropFromRef >= t;
    let tone = "ok";
    let message = `Already dropped ${dropFromRef.toFixed(2)}% from ₹${fmt(ref)}. Need ${distance.toFixed(2)}% more.`;
    if (willFire) {
      tone = "fires";
      message = `Already dropped ${dropFromRef.toFixed(2)}% — alert will fire immediately.`;
    } else if (t <= 0 || t >= 50) {
      tone = "warn";
      message = `% drop should typically be between 1–30%.`;
    }
    return { tone, message, distancePct: distance, willFireNow: willFire, distanceLabel: willFire ? "FIRES" : `${distance.toFixed(2)}% to go` };
  }
  return { tone: "ok", message: "", distancePct: null, willFireNow: false, distanceLabel: "" };
}

export const toneClass = {
  ok: "text-gray-500",
  warn: "text-[#b58500]",
  danger: "text-[#FF3B30]",
  fires: "text-[#002FA7]",
};

export const tonePillClass = {
  ok: "bg-gray-50 text-gray-600 border-gray-200",
  warn: "bg-[#FFF7E6] text-[#b58500] border-[#FFCC00]/40",
  danger: "bg-[#FEF2F2] text-[#FF3B30] border-[#FF3B30]/30",
  fires: "bg-[#002FA7]/5 text-[#002FA7] border-[#002FA7]/30",
};
