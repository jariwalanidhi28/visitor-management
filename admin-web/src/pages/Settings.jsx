import React, { useState, useEffect } from "react";
import api from "../api/client";
import {
  Settings as SettingsIcon,
  Radio,
  MapPin,
  Cpu,
  ShieldCheck,
  Save,
  CheckCircle2,
  ExternalLink,
  Key,
  Layers,
  Sparkles,
} from "lucide-react";

export default function Settings() {
  const [provider, setProvider] = useState("native_geocoding");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Geocoding form
  const [geocodingKey, setGeocodingKey] = useState("");
  const [geocodingProvider, setGeocodingProvider] = useState("google");
  const [hasGeoKey, setHasGeoKey] = useState(false);

  // HyperTrack form
  const [htAccountId, setHtAccountId] = useState("");
  const [htPublishableKey, setHtPublishableKey] = useState("");
  const [htSecretKey, setHtSecretKey] = useState("");
  const [hasHtSecret, setHasHtSecret] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/settings/admin");
      if (res.data.success) {
        const s = res.data.settings;
        setProvider(s.trackingProvider || "native_geocoding");

        setGeocodingProvider(s.geocoding?.provider || "google");
        setHasGeoKey(s.geocoding?.hasApiKey || false);
        if (s.geocoding?.apiKeyMasked) {
          setGeocodingKey(s.geocoding.apiKeyMasked);
        }

        setHtAccountId(s.hypertrack?.accountId || "");
        setHtPublishableKey(s.hypertrack?.publishableKey || "");
        setHasHtSecret(s.hypertrack?.hasSecretKey || false);
        if (s.hypertrack?.secretKeyMasked) {
          setHtSecretKey(s.hypertrack.secretKeyMasked);
        }
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to load tracking settings",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = {
        trackingProvider: provider,
        geocoding: {
          provider: geocodingProvider,
        },
        hypertrack: {
          accountId: htAccountId,
          publishableKey: htPublishableKey,
        },
      };

      // Only send keys if changed from masked
      if (geocodingKey && !geocodingKey.includes("••••")) {
        payload.geocoding.apiKey = geocodingKey;
      }
      if (htSecretKey && !htSecretKey.includes("••••")) {
        payload.hypertrack.secretKey = htSecretKey;
      }

      const res = await api.put("/settings/admin", payload);
      if (res.data.success) {
        setFeedback({
          type: "success",
          message: res.data.message || "Tracking configuration saved successfully!",
        });
        fetchSettings();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 font-medium">
        Loading live tracking configuration...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          <span>Tracking Engine & Geolocation Settings</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Choose which engine processes live check-in place tracking, coordinates, and worker trips.
        </p>
      </div>

      {feedback.message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Active Provider Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Geocoding & High-Accuracy GPS */}
          <div
            onClick={() => setProvider("native_geocoding")}
            className={`cursor-pointer rounded-2xl p-6 border-2 transition-all relative flex flex-col justify-between ${
              provider === "native_geocoding"
                ? "border-blue-600 bg-blue-50/20 shadow-md shadow-blue-500/10"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      provider === "native_geocoding"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {provider === "native_geocoding" ? "ACTIVE ENGINE" : "STANDBY"}
                  </span>
                  <input
                    type="radio"
                    name="trackingProvider"
                    checked={provider === "native_geocoding"}
                    onChange={() => setProvider("native_geocoding")}
                    className="w-4 h-4 text-blue-600"
                  />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Geocoding & Place Verification
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Uses satellite GPS fixes combined with Google Maps Geocoding & OpenStreetMap to resolve verified place names, streets, and exact postal addresses.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Verified Google Places reverse geocoding</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Full employee privacy (no background battery drain)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>OpenStreetMap Nominatim zero-cost fallback</span>
                </div>
              </div>
            </div>

            {/* Geocoding Config Inputs */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Geocoding Engine Provider
                </label>
                <select
                  value={geocodingProvider}
                  onChange={(e) => setGeocodingProvider(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium text-slate-800"
                >
                  <option value="google">Google Maps Geocoding API</option>
                  <option value="nominatim">OpenStreetMap Nominatim (Free)</option>
                </select>
              </div>

              {geocodingProvider === "google" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase text-slate-600">
                      Google Maps API Key
                    </label>
                    {hasGeoKey && (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Key Configured
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geocodingKey}
                    onChange={(e) => setGeocodingKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Leave blank to use OpenStreetMap or environment fallback.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: HyperTrack Real-Time Workforce Tracking */}
          <div
            onClick={() => setProvider("hypertrack")}
            className={`cursor-pointer rounded-2xl p-6 border-2 transition-all relative flex flex-col justify-between ${
              provider === "hypertrack"
                ? "border-emerald-600 bg-emerald-50/20 shadow-md shadow-emerald-500/10"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      provider === "hypertrack"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {provider === "hypertrack" ? "ACTIVE ENGINE" : "STANDBY"}
                  </span>
                  <input
                    type="radio"
                    name="trackingProvider"
                    checked={provider === "hypertrack"}
                    onChange={() => setProvider("hypertrack")}
                    className="w-4 h-4 text-emerald-600"
                  />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                HyperTrack Live Place Tracking
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Real-time workforce movement tracking, automated trip monitoring, geofenced place arrivals, device health, and fake GPS spoof detection.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Real-time worker movement & live breadcrumbs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Battery-optimized device location engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Automatic geofence entry & exit detection</span>
                </div>
              </div>
            </div>

            {/* HyperTrack Config Inputs */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  HyperTrack Account ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. ht_acc_..."
                  value={htAccountId}
                  onChange={(e) => setHtAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase text-slate-600">
                    HyperTrack Secret Key
                  </label>
                  {hasHtSecret && (
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Secret Key Set
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="Secret API Key"
                  value={htSecretKey}
                  onChange={(e) => setHtSecretKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  HyperTrack Publishable Key (Mobile Client)
                </label>
                <input
                  type="text"
                  placeholder="pk_..."
                  value={htPublishableKey}
                  onChange={(e) => setHtPublishableKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Action Banner */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Active Engine:{" "}
                <span className="text-blue-600 uppercase font-mono">
                  {provider === "hypertrack" ? "HyperTrack Live Tracking" : "Geocoding & High-Accuracy GPS"}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                Mobile check-ins will immediately adopt this engine without restarting servers.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Apply & Save Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
