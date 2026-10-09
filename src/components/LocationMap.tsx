"use client";
import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Compass, AlertCircle, ExternalLink } from "lucide-react";
import { calculateHaversineDistanceKm } from "@/lib/matching";

interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  info?: string;
  type?: "DONOR" | "SHELTER";
}

interface LocationMapProps {
  origin: { lat: number; lng: number; label?: string };
  destination?: { lat: number; lng: number; label?: string };
  markers?: MapMarker[];
  interactive?: boolean;
  onSelectLocation?: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

export function LocationMap({
  origin,
  destination,
  markers = [],
  interactive = false,
  onSelectLocation,
  className = "h-72 w-full",
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>(origin);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Calculate distance if destination is supplied
  const distanceKm = destination
    ? calculateHaversineDistanceKm([origin.lng, origin.lat], [destination.lng, destination.lat])
    : null;

  const estimatedMins = distanceKm ? Math.round((distanceKm / 25) * 60) : null;

  useEffect(() => {
    if (!apiKey) {
      setLoadError(true);
      return;
    }

    // Check if google is already defined on window
    if ((window as any).google?.maps) {
      setMapsLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => setLoadError(true);
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", () => setMapsLoaded(true));
      script.addEventListener("error", () => setLoadError(true));
    }
  }, [apiKey]);

  // Initialize Google Maps instance if loaded
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || !(window as any).google?.maps) return;

    try {
      const google = (window as any).google;
      const center = { lat: origin.lat || 40.7128, lng: origin.lng || -74.006 };

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: destination ? 12 : 14,
        disableDefaultUI: false,
        zoomControl: true,
      });

      // Add Origin Marker
      new google.maps.Marker({
        position: center,
        map,
        title: origin.label || "Origin",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#1f4d36",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Add Destination Marker
      if (destination) {
        new google.maps.Marker({
          position: { lat: destination.lat, lng: destination.lng },
          map,
          title: destination.label || "Destination",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#b7791f",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(center);
        bounds.extend({ lat: destination.lat, lng: destination.lng });
        map.fitBounds(bounds, 50);
      }

      // Add other markers
      markers.forEach((m) => {
        new google.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map,
          title: m.label,
        });
      });

      // Interactive click to pick location
      if (interactive && onSelectLocation) {
        map.addListener("click", (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setSelectedCoords({ lat, lng });
          onSelectLocation({ lat, lng });
        });
      }
    } catch {
      setLoadError(true);
    }
  }, [mapsLoaded, origin, destination, markers, interactive, onSelectLocation]);

  // Graceful Fallback Visualization
  if (loadError || !apiKey) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-ink/15 bg-slate-900 text-white ${className}`}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-lg bg-black/40 px-2.5 py-1 text-xs backdrop-blur-md">
              <Compass className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-medium text-emerald-300">Geospatial Logistics Radar</span>
            </div>

            {distanceKm !== null && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300 shadow-sm">
                <Navigation className="h-3 w-3 text-emerald-400" />
                <span>~{distanceKm} km straight-line (est. {estimatedMins} min)</span>
              </div>
            )}
          </div>

          {/* Coordinate pin visualizer */}
          <div className="my-auto flex items-center justify-around py-4">
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-400/20 animate-pulse">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="mt-2 text-xs font-semibold text-emerald-200">
                {origin.label || "Pickup Point"}
              </span>
              <span className="text-[10px] text-slate-400">
                {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
              </span>
            </div>

            {destination && (
              <>
                <div className="flex flex-1 flex-col items-center px-4">
                  <div className="w-full border-t-2 border-dashed border-emerald-400/40 relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-[10px] text-emerald-300">
                      ~{distanceKm} km
                    </span>
                  </div>
                  <span className="mt-1 text-[10px] text-slate-400">Direct Route</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg ring-4 ring-amber-400/20">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-amber-200">
                    {destination.label || "Shelter Drop-off"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-amber-400" />
              Fallback View: Calculated via Haversine coordinates.
            </span>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}${
                destination ? `&destination=${destination.lat},${destination.lng}` : ""
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:underline"
            >
              Open in Google Maps
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-ink/15 ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
      {interactive && (
        <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2.5 py-1 text-[11px] text-ink font-medium shadow-xs">
          Selected: {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
}
