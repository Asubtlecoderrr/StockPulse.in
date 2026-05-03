import { useEffect, useState } from "react";
import { endpoints } from "@/lib/alertApi";
import Header from "@/components/alert/Header";
import SearchBar from "@/components/alert/SearchBar";
import Watchlist from "@/components/alert/Watchlist";
import AlertsHistory from "@/components/alert/AlertsHistory";
import TwilioBanner from "@/components/alert/TwilioBanner";
import { toast } from "sonner";

export default function Dashboard() {
  const [marketStatus, setMarketStatus] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = async () => {
    try {
      const [ms, wl, al, se] = await Promise.all([
        endpoints.marketStatus(),
        endpoints.listWatchlist(),
        endpoints.listAlerts(20),
        endpoints.getSettings(),
      ]);
      setMarketStatus(ms);
      setWatchlist(wl);
      setAlerts(al);
      setSettings(se);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load dashboard data");
    }
  };

  useEffect(() => {
    loadAll();
    const t = setInterval(() => {
      endpoints.marketStatus().then(setMarketStatus).catch(() => {});
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const handleAdd = async (payload) => {
    try {
      const newItem = await endpoints.addWatchlist(payload);
      setWatchlist((prev) => [newItem, ...prev]);
      toast.success(`${payload.name} added to watchlist`);
    } catch (e) {
      const msg = e?.response?.data?.detail || "Could not add to watchlist";
      toast.error(msg);
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      const updated = await endpoints.updateWatchlist(id, payload);
      setWatchlist((prev) => prev.map((w) => (w.id === id ? updated : w)));
      toast.success("Alert updated");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await endpoints.deleteWatchlist(id);
      setWatchlist((prev) => prev.filter((w) => w.id !== id));
      toast.success("Removed from watchlist");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const summary = await endpoints.refreshWatchlist();
      const [wl, al] = await Promise.all([
        endpoints.listWatchlist(),
        endpoints.listAlerts(20),
      ]);
      setWatchlist(wl);
      setAlerts(al);
      const parts = [];
      parts.push(`${summary.updated} updated`);
      if (summary.alerts_sent) parts.push(`${summary.alerts_sent} alerts fired`);
      if (summary.errors) parts.push(`${summary.errors} errors`);
      toast.success(`Refresh complete — ${parts.join(", ")}`);
    } catch (e) {
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveSettings = async (destination_whatsapp) => {
    try {
      const updated = await endpoints.updateSettings({ destination_whatsapp });
      setSettings(updated);
      toast.success("WhatsApp number saved");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not save number");
    }
  };

  return (
    <div className="min-h-screen bg-white" data-testid="dashboard-root">
      <Header
        marketStatus={marketStatus}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <section className="mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500 mb-3">
            NSE · BSE · ETF ALERTS
          </p>
          <h1
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] leading-none title-underline"
            data-testid="page-title"
          >
            Price signals,<br />
            built for India.
          </h1>
          <p className="mt-8 text-base sm:text-lg text-[#4B5563] max-w-2xl">
            Track any NSE stock or ETF, set a threshold, and get an instant
            WhatsApp ping when the market crosses the line — not a second later.
          </p>
        </section>

        <TwilioBanner settings={settings} onSave={handleSaveSettings} />

        <section className="mt-10">
          <SearchBar onAdd={handleAdd} />
        </section>

        <section className="mt-10">
          <Watchlist
            items={watchlist}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </section>

        <section className="mt-14">
          <AlertsHistory alerts={alerts} />
        </section>

        <footer className="mt-20 border-t border-gray-200 pt-6 pb-10 text-xs text-gray-500 font-mono-tab flex flex-wrap items-center justify-between gap-2">
          <span>STOCKPULSE.IN · Data via Yahoo Finance · Scheduler every 5 min during NSE hours</span>
          <span className="text-[#002FA7]">v1.0</span>
        </footer>
      </main>
    </div>
  );
}
