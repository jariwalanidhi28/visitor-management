import React, { useState, useEffect } from "react";
import api, { API_BASE_URL } from "../api/client";
import {
  X,
  MapPin,
  Clock,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Building,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Leaflet marker fix for default icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const checkInIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const checkOutIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function AttendanceDetailModal({ recordId, onClose }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkInPhotoBlob, setCheckInPhotoBlob] = useState(null);
  const [checkOutPhotoBlob, setCheckOutPhotoBlob] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/attendance/${recordId}`);
        if (res.data.success) {
          const data = res.data.record;
          setRecord(data);

          // Fetch protected photos with auth credentials
          if (data.checkIn?.photoUrl) {
            try {
              const photoRes = await api.get(`/photos/${data.checkIn.photoUrl}`, {
                responseType: "blob",
              });
              setCheckInPhotoBlob(URL.createObjectURL(photoRes.data));
            } catch (err) {
              console.error("Failed to load check-in photo:", err);
            }
          }

          if (data.checkOut?.photoUrl) {
            try {
              const photoRes = await api.get(`/photos/${data.checkOut.photoUrl}`, {
                responseType: "blob",
              });
              setCheckOutPhotoBlob(URL.createObjectURL(photoRes.data));
            } catch (err) {
              console.error("Failed to load check-out photo:", err);
            }
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load record");
      } finally {
        setLoading(false);
      }
    };

    if (recordId) {
      fetchRecord();
    }
  }, [recordId]);

  if (!recordId) return null;

  const openInGoogleMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
  };

  const cin = record?.checkIn;
  const cout = record?.checkOut;

  // Center coordinate for Leaflet map
  const centerLat = cin?.latitude || cout?.latitude || 12.9716;
  const centerLng = cin?.longitude || cout?.longitude || 77.5946;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold">Attendance Record Details</h3>
            <p className="text-xs text-slate-400">
              ID: {record?._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-500 font-medium">
              Loading attendance data and secure photos...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          ) : (
            <>
              {/* Employee & Meta Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {record.userId?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {record.userId?.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {record.userId?.employeeId}
                      </span>
                      <span>•</span>
                      <span>{record.userId?.department}</span>
                      <span>•</span>
                      <span>{record.userId?.designation}</span>
                      <span>•</span>
                      <span>{record.userId?.mobile}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block uppercase font-semibold">
                      Total Duration
                    </span>
                    <span className="text-base font-bold text-slate-800">
                      {record.durationMinutes !== null && record.durationMinutes !== undefined
                        ? `${record.durationMinutes} mins`
                        : "Ongoing"}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      record.status === "checked_out"
                        ? "bg-slate-100 text-slate-700 border border-slate-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse"
                    }`}
                  >
                    {record.status === "checked_out" ? "Checked Out" : "Checked In"}
                  </span>
                </div>
              </div>

              {/* Tracking Engine Source Banner */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                    Tracking Engine:
                  </span>
                  {record.trackingProvider === "hypertrack" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      HyperTrack Live Workforce Tracking
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Geocoding & High-Accuracy GPS
                    </span>
                  )}
                </div>

                {record.trackingProvider === "hypertrack" && record.trackingMetadata?.deviceId && (
                  <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                    <span>Device: {record.trackingMetadata.deviceId}</span>
                    {record.trackingMetadata.tripId && (
                      <span>• Trip: {record.trackingMetadata.tripId}</span>
                    )}
                  </div>
                )}

                {record.trackingProvider !== "hypertrack" && (
                  <div className="text-slate-500 text-[11px]">
                    Verified Engine:{" "}
                    <b className="capitalize text-slate-700">
                      {record.trackingMetadata?.geocodingEngine || "Google Maps / Nominatim"}
                    </b>
                  </div>
                )}
              </div>

              {/* Destination & Purpose Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Destination
                  </span>
                  <div className="flex items-start gap-2">
                    <Building className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {record.destinationId
                          ? record.destinationId.name
                          : record.customDestination || "Custom Site"}
                      </p>
                      {record.destinationId?.address && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {record.destinationId.address}, {record.destinationId.city},{" "}
                          {record.destinationId.state}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Purpose & Remarks
                  </span>
                  <p className="text-sm font-semibold text-slate-800">
                    {record.purpose}
                  </p>
                  {record.remarks && (
                    <p className="text-xs text-slate-500 mt-1">
                      Remarks: {record.remarks}
                    </p>
                  )}
                </div>
              </div>

              {/* Side-by-Side Check-In & Check-Out Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Check-In Card */}
                <div className="border border-emerald-200 bg-emerald-50/20 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        Check-In Verification
                      </h4>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {cin?.timestamp
                        ? new Date(cin.timestamp).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>

                  {/* Photo Preview */}
                  <div className="w-full h-52 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
                    {checkInPhotoBlob ? (
                      <img
                        src={checkInPhotoBlob}
                        alt="Check-In Live Photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-slate-400 p-4">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                        <span className="text-xs">Photo loading or unavailable</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[11px] text-white font-medium">
                      Live In-App Selfie
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="bg-white/80 rounded-xl p-3 border border-emerald-100 space-y-1 text-xs">
                    <div className="text-[11px] font-mono text-slate-600">
                      <span className="font-semibold text-slate-700">Latitude : </span>
                      <span className="font-mono text-slate-900">{cin?.latitude?.toFixed(7) || "—"}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600">
                      <span className="font-semibold text-slate-700">Longitude : </span>
                      <span className="font-mono text-slate-900">{cin?.longitude?.toFixed(7) || "—"}</span>
                    </div>
                    <div className="text-[12px] text-slate-800 leading-snug pt-0.5">
                      <span className="font-semibold text-slate-700">Location : </span>
                      <span className="font-medium text-slate-900">
                        {cin?.address || `${cin?.latitude?.toFixed(5)}, ${cin?.longitude?.toFixed(5)}`}
                      </span>
                    </div>
                    {cin?.accuracy && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        GPS Accuracy: ±{cin.accuracy}m
                      </div>
                    )}

                    {cin?.latitude && cin?.longitude && (
                      <button
                        onClick={() => openInGoogleMaps(cin.latitude, cin.longitude)}
                        className="w-full mt-2 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                        <span>View Check-In on Google Maps</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Check-Out Card */}
                <div
                  className={`border rounded-2xl p-5 space-y-4 ${
                    cout
                      ? "border-indigo-200 bg-indigo-50/20"
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          cout ? "bg-indigo-500" : "bg-slate-400"
                        }`}
                      />
                      <h4 className="font-bold text-slate-900 text-sm">
                        Check-Out Verification
                      </h4>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {cout?.timestamp
                        ? new Date(cout.timestamp).toLocaleString()
                        : "Pending"}
                    </span>
                  </div>

                  {cout ? (
                    <>
                      {/* Photo Preview */}
                      <div className="w-full h-52 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
                        {checkOutPhotoBlob ? (
                          <img
                            src={checkOutPhotoBlob}
                            alt="Check-Out Live Photo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-slate-400 p-4">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                            <span className="text-xs">Photo loading...</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[11px] text-white font-medium">
                          Live In-App Selfie
                        </div>
                      </div>

                      {/* Location Info */}
                      <div className="bg-white/80 rounded-xl p-3 border border-indigo-100 space-y-1 text-xs">
                        <div className="text-[11px] font-mono text-slate-600">
                          <span className="font-semibold text-slate-700">Latitude : </span>
                          <span className="font-mono text-slate-900">{cout?.latitude?.toFixed(7) || "—"}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-600">
                          <span className="font-semibold text-slate-700">Longitude : </span>
                          <span className="font-mono text-slate-900">{cout?.longitude?.toFixed(7) || "—"}</span>
                        </div>
                        <div className="text-[12px] text-slate-800 leading-snug pt-0.5">
                          <span className="font-semibold text-slate-700">Location : </span>
                          <span className="font-medium text-slate-900">
                            {cout?.address || `${cout?.latitude?.toFixed(5)}, ${cout?.longitude?.toFixed(5)}`}
                          </span>
                        </div>
                        {cout?.accuracy && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            GPS Accuracy: ±{cout.accuracy}m
                          </div>
                        )}

                        {cout?.latitude && cout?.longitude && (
                          <button
                            onClick={() => openInGoogleMaps(cout.latitude, cout.longitude)}
                            className="w-full mt-2 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Check-Out on Google Maps</span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <Clock className="w-10 h-10 mb-2 text-slate-300 animate-pulse" />
                      <p className="font-semibold text-sm text-slate-600">
                        Check-Out In Progress
                      </p>
                      <p className="text-xs mt-1">
                        Employee has not submitted their check-out photo and GPS yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive OpenStreetMap via Leaflet */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Captured Locations (OpenStreetMap)</span>
                  </h4>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Check-In
                    </span>
                    {cout && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        Check-Out
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-72 w-full">
                  <MapContainer
                    center={[centerLat, centerLng]}
                    zoom={14}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {cin?.latitude && cin?.longitude && (
                      <Marker
                        position={[cin.latitude, cin.longitude]}
                        icon={checkInIcon}
                      >
                        <Popup>
                          <div className="text-xs font-sans">
                            <b className="text-emerald-700">Check-In Location</b>
                            <br />
                            {cin.address || `${cin.latitude}, ${cin.longitude}`}
                            <br />
                            <span className="text-slate-400">
                              {new Date(cin.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {cout?.latitude && cout?.longitude && (
                      <Marker
                        position={[cout.latitude, cout.longitude]}
                        icon={checkOutIcon}
                      >
                        <Popup>
                          <div className="text-xs font-sans">
                            <b className="text-red-700">Check-Out Location</b>
                            <br />
                            {cout.address || `${cout.latitude}, ${cout.longitude}`}
                            <br />
                            <span className="text-slate-400">
                              {new Date(cout.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
