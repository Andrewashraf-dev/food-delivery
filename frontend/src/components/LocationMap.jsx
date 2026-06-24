import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = { lat: 30.059, lng: 31.239 };

const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#D4150C;border-radius:999px;border:2px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function PinPicker({ position, onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position ? <Marker position={[position.lat, position.lng]} icon={pinIcon} /> : null;
}

/** Approximate delivery neighborhood on the map (circle around region center). */
function RegionAreaOverlay({ highlight }) {
  const c = highlight?.center;
  const r = highlight?.radiusMeters;
  if (!c || !Number.isFinite(c.lat) || !Number.isFinite(c.lng) || !Number.isFinite(r) || r <= 0) {
    return null;
  }
  return (
    <Circle
      center={[c.lat, c.lng]}
      radius={r}
      pathOptions={{
        color: '#c9a227',
        fillColor: '#c9a227',
        fillOpacity: 0.12,
        weight: 2,
      }}
    >
      {highlight.label ? <Popup>{highlight.label}</Popup> : null}
    </Circle>
  );
}

/** Pan/zoom without remounting the map (avoids tile flash and wrong frames). */
function MapController({ center, zoom, flyTo }) {
  const map = useMap();
  useEffect(() => {
    if (!Number.isFinite(center?.lat) || !Number.isFinite(center?.lng)) return;
    const z = zoom != null && Number.isFinite(zoom) ? zoom : 18;
    const latlng = [center.lat, center.lng];
    if (flyTo) {
      map.flyTo(latlng, z, { duration: 0.55, easeLinearity: 0.35 });
    } else {
      map.setView(latlng, z, { animate: true, duration: 0.25 });
    }
    const id = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(id);
  }, [center?.lat, center?.lng, zoom, flyTo, map]);
  return null;
}

/** Leaflet often measures 0×0 when the map first renders inside a hidden step / flex layout. */
function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const root = el.parentElement;
    if (!root) return undefined;

    const bump = () => {
      map.invalidateSize({ animate: false });
    };

    bump();
    const t1 = window.setTimeout(bump, 100);
    const t2 = window.setTimeout(bump, 400);

    const ro = new ResizeObserver(() => bump());
    ro.observe(root);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
    };
  }, [map]);
  return null;
}

export default function LocationMap({
  center,
  position,
  onChange,
  height = 320,
  zoom = 18,
  flyTo = false,
  regionHighlight = null,
}) {
  const c = useMemo(() => {
    if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
      return { lat: center.lat, lng: center.lng };
    }
    return DEFAULT_CENTER;
  }, [center]);

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 relative z-0"
      style={{ height, minHeight: height }}
    >
      {/*
        Stable mount: do NOT key MapContainer by lat/lng — that remounts the map on every
        region change and causes broken tiles, wrong bounds, and jitter. Pan/zoom via MapController only.
      */}
      <MapContainer
        center={[c.lat, c.lng]}
        zoom={zoom}
        scrollWheelZoom
        zoomControl
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizeFix />
        <MapController center={c} zoom={zoom} flyTo={flyTo} />
        <RegionAreaOverlay highlight={regionHighlight} />
        <PinPicker position={position} onPick={onChange} />
      </MapContainer>
    </div>
  );
}
