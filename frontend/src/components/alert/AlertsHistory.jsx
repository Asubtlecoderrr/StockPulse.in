import { BellRing, ArrowRight } from "lucide-react";

function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AlertsHistory({ alerts }) {
  return (
    <div data-testid="alerts-history">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          / Alert Log
        </p>
        <p className="text-[10px] font-mono-tab text-gray-400">
          Latest {alerts?.length || 0}
        </p>
      </div>

      {!alerts || alerts.length === 0 ? (
        <div className="border border-gray-200 rounded-sm bg-white p-8 text-center" data-testid="alerts-empty">
          <BellRing className="w-5 h-5 text-gray-400 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">No alerts fired yet. When thresholds are breached during market hours, they will appear here.</p>
        </div>
      ) : (
        <ul className="border border-gray-200 rounded-sm bg-white divide-y divide-gray-100">
          {alerts.map((a) => {
            const bare = a.symbol.replace(".NS", "").replace(".BO", "");
            const statusColor = {
              sent: "text-[#00C853] bg-[#F0FDF4] border-[#00C853]/30",
              mocked: "text-[#002FA7] bg-[#002FA7]/5 border-[#002FA7]/30",
              failed: "text-[#FF3B30] bg-[#FEF2F2] border-[#FF3B30]/30",
            }[a.delivery_status] || "text-gray-600 bg-gray-100 border-gray-300";
            return (
              <li key={a.id} className="px-4 py-3 flex items-start justify-between gap-4" data-testid={`alert-row-${a.id}`}>
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#FEF2F2] border border-[#FF3B30]/30 rounded-sm flex-shrink-0">
                    <BellRing className="w-4 h-4 text-[#FF3B30]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono-tab font-bold text-sm text-[#111827]">{bare}</span>
                      <span className="text-xs text-gray-400 font-mono-tab uppercase tracking-wider">{a.alert_type}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded-sm ${statusColor}`}>
                        {a.delivery_status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 line-clamp-2">{a.message}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono-tab text-xs text-gray-500">{timeAgo(a.sent_at)}</p>
                  <p className="font-mono-tab text-xs text-gray-400">Rs. {a.price}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
