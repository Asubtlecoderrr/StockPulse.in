import { useState, useEffect } from "react";
import { MessageSquare, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BG_IMAGE = "https://static.prod-images.emergentagent.com/jobs/4f01fa85-3b85-4e40-a161-749cc3ce7439/images/49e9b4c4091cbd811102648b933ca8cc6566bc541e05b1cd74dff3bc1908354b.png";

export default function TwilioBanner({ settings, onSave }) {
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.destination_whatsapp) setNumber(settings.destination_whatsapp);
  }, [settings?.destination_whatsapp]);

  if (!settings) return null;

  const destination = settings.destination_whatsapp;
  const twilioReady = settings.twilio_configured;
  const fullyReady = !!destination && twilioReady;

  const handleSave = async () => {
    const v = number.trim();
    if (!v) return;
    setSaving(true);
    await onSave(v);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div
      className="relative border border-gray-200 rounded-sm overflow-hidden"
      style={{
        backgroundImage: `url(${BG_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      data-testid="twilio-banner"
    >
      <div className="absolute inset-0 bg-white/92 backdrop-blur-[2px]" />
      <div className="relative z-10 p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="flex items-start gap-4 max-w-2xl">
          <div
            className={`w-10 h-10 flex items-center justify-center border rounded-sm flex-shrink-0 ${
              fullyReady
                ? "bg-[#F0FDF4] border-[#00C853]/40 text-[#00C853]"
                : "bg-white border-[#FFCC00]/70 text-[#b58500]"
            }`}
          >
            {fullyReady ? <Check className="w-5 h-5" strokeWidth={2.5} /> : <AlertTriangle className="w-5 h-5" strokeWidth={2} />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 mb-1">
              WhatsApp Delivery
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827]">
              {fullyReady
                ? "Live delivery is armed."
                : twilioReady
                ? "Add your WhatsApp number to receive alerts."
                : "Running in MOCK mode — add Twilio + number to go live."}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {twilioReady
                ? "Alerts fire via Twilio WhatsApp sandbox/production to the number below."
                : "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in backend/.env — alerts are logged to console until then."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto">
          {editing ? (
            <>
              <Input
                data-testid="whatsapp-input"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="+919999999999"
                className="h-10 w-full sm:w-56 rounded-sm border-gray-300 font-mono-tab text-sm"
              />
              <Button
                onClick={handleSave}
                disabled={saving || !number.trim()}
                className="h-10 px-4 rounded-sm bg-[#002FA7] text-white hover:bg-[#002480] text-xs font-bold uppercase tracking-wider"
                data-testid="whatsapp-save"
              >
                {saving ? "Saving" : "Save"}
              </Button>
              <Button
                onClick={() => { setEditing(false); setNumber(destination || ""); }}
                variant="outline"
                className="h-10 px-3 rounded-sm border-gray-300 text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              {destination ? (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-sm bg-white">
                  <MessageSquare className="w-3.5 h-3.5 text-[#00C853]" />
                  <span className="font-mono-tab text-xs" data-testid="whatsapp-number-display">{destination}</span>
                </div>
              ) : null}
              <Button
                onClick={() => setEditing(true)}
                className="h-10 px-4 rounded-sm bg-[#002FA7] text-white hover:bg-[#002480] text-xs font-bold uppercase tracking-wider"
                data-testid="whatsapp-edit"
              >
                {destination ? "Change Number" : "Set WhatsApp"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
