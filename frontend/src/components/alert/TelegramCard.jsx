import { useEffect, useState } from "react";
import { Send, Check, AlertTriangle, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { endpoints } from "@/lib/alertApi";
import { toast } from "sonner";

export default function TelegramCard({ settings, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (settings?.telegram_chat_id) setChatId(settings.telegram_chat_id);
  }, [settings?.telegram_chat_id]);

  if (!settings) return null;
  const ready = !!settings.telegram_bot_configured;

  const save = async () => {
    if (!chatId.trim()) return;
    setBusy(true);
    try {
      const payload = { chat_id: chatId.trim() };
      if (token.trim()) payload.bot_token = token.trim();
      const updated = await endpoints.updateTelegram(payload);
      onChanged(updated);
      toast.success("Telegram saved");
      setEditing(false);
      setToken("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not save Telegram");
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      await endpoints.testTelegram();
      toast.success("Test message sent — check Telegram!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      const updated = await endpoints.clearTelegram();
      onChanged(updated);
      setToken("");
      setChatId("");
      toast.success("Telegram disconnected");
    } catch (e) {
      toast.error("Could not disconnect");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="border border-gray-200 rounded-sm bg-white"
      data-testid="telegram-card"
    >
      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 flex items-center justify-center border rounded-sm ${
              ready
                ? "bg-[#F0FDF4] border-[#00C853]/40 text-[#00C853]"
                : "bg-white border-gray-200 text-[#229ED9]"
            }`}
          >
            {ready ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <Send className="w-4 h-4" strokeWidth={2} />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
              Telegram · 100% Free
            </p>
            <p className="font-display text-base font-bold tracking-tight text-[#111827]">
              {ready ? "Telegram is connected." : "Add a bot for free, instant alerts."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ready ? (
            <>
              <Button
                onClick={test}
                disabled={testing}
                className="h-9 px-3 rounded-sm bg-[#229ED9] text-white hover:bg-[#1c8ec0] text-xs font-bold uppercase tracking-wider"
                data-testid="telegram-test"
              >
                {testing ? "Sending…" : "Send Test"}
              </Button>
              <Button
                onClick={() => setEditing((e) => !e)}
                variant="outline"
                className="h-9 px-3 rounded-sm border-gray-300 text-xs font-bold uppercase tracking-wider"
                data-testid="telegram-edit"
              >
                {editing ? "Close" : "Edit"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setEditing(true)}
              className="h-9 px-3 rounded-sm bg-[#229ED9] text-white hover:bg-[#1c8ec0] text-xs font-bold uppercase tracking-wider"
              data-testid="telegram-setup"
            >
              Set Up
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="px-5 py-5 space-y-4 bg-gray-50/60">
          <div className="text-xs text-gray-600 leading-relaxed space-y-1">
            <p className="font-bold text-[#111827]">2-minute setup:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Open{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#229ED9] underline inline-flex items-center gap-1"
                >
                  @BotFather <ExternalLink className="w-3 h-3" />
                </a>{" "}
                in Telegram → send <span className="font-mono-tab">/newbot</span> → copy the bot token.
              </li>
              <li>
                Open your new bot, hit Start, then visit{" "}
                <span className="font-mono-tab">api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</span>{" "}
                to find your <span className="font-mono-tab">chat.id</span>.
              </li>
              <li>Paste both below and hit Save.</li>
            </ol>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tg-token" className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Bot Token {ready ? <span className="text-gray-400 normal-case">(leave blank to keep saved)</span> : null}
              </Label>
              <Input
                id="tg-token"
                data-testid="telegram-token-input"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456789:ABCdef..."
                className="mt-1 h-10 rounded-sm border-gray-300 font-mono-tab text-sm"
              />
            </div>
            <div>
              <Label htmlFor="tg-chat" className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Chat ID
              </Label>
              <Input
                id="tg-chat"
                data-testid="telegram-chatid-input"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. 987654321"
                className="mt-1 h-10 rounded-sm border-gray-300 font-mono-tab text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            {ready ? (
              <Button
                onClick={disconnect}
                variant="ghost"
                disabled={busy}
                className="h-9 px-3 text-[#FF3B30] hover:bg-[#FEF2F2] text-xs font-bold uppercase tracking-wider"
                data-testid="telegram-disconnect"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Disconnect
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button
                onClick={() => setEditing(false)}
                variant="outline"
                className="h-9 px-3 rounded-sm border-gray-300 text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={busy || !chatId.trim() || (!ready && !token.trim())}
                className="h-9 px-4 rounded-sm bg-[#002FA7] text-white hover:bg-[#002480] text-xs font-bold uppercase tracking-wider"
                data-testid="telegram-save"
              >
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : ready ? (
        <div className="px-5 py-3 flex items-center justify-between text-xs text-gray-500">
          <span className="font-mono-tab">
            Chat ID · {settings.telegram_chat_id} <span className="text-gray-300 mx-1.5">·</span> Bot token saved
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#00C853] text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-[#00C853] rounded-full live-dot" /> Active
          </span>
        </div>
      ) : (
        <div className="px-5 py-3 text-xs text-gray-500 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[#b58500]" />
          Not configured. Telegram alerts won't fire until you set it up.
        </div>
      )}
    </div>
  );
}
