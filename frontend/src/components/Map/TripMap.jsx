import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { calculateTotalDistance } from './haversine';
import RouteIcon from '@mui/icons-material/Route';

const MODE_COLOR = {
  DRIVING:   '#1976d2',
  WALKING:   '#388e3c',
  TRANSIT:   '#f57c00',
  BICYCLING: '#7b1fa2',
};
const getModeColor = (mode) => MODE_COLOR[mode] ?? '#1976d2';

const OSRM_PROFILE = {
  DRIVING:   'driving',
  WALKING:   'walking',
  BICYCLING: 'cycling',
  TRANSIT:   'driving',
};

const KOREA_CENTER = [36.5, 127.5];

const createNumberedIcon = (number, selected = false) =>
  L.divIcon({
    html: `<div style="
      width:28px;height:28px;
      background:${selected ? '#E07B39' : '#1A3A5C'};
      color:white;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:12px;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    ">${number}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });

const BoundsController = ({ locations }) => {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) {
      map.setView(KOREA_CENTER, 7);
    } else if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 14);
    } else {
      map.fitBounds(
        locations.map((l) => [l.latitude, l.longitude]),
        { padding: [50, 50] }
      );
    }
  }, [locations, map]);
  return null;
};

const TripMap = ({ locations = [], onLocationSelect, readOnly = false }) => {
  const [routeSegments, setRouteSegments] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [routeRequested, setRouteRequested] = useState(false);
  const [selectedLocId, setSelectedLocId] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const containerRef = useRef(null);
  const fetchGenRef = useRef(0);
  const routeRequestedRef = useRef(false);
  const locationsRef = useRef(locations);
  locationsRef.current = locations;

  // Intersection Observer: map renders only when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchOSRMRoute = useCallback(async (locs) => {
    if (!locs || locs.length < 2) return;
    const gen = ++fetchGenRef.current;
    setRouteLoading(true);
    setRouteError(false);

    // Group consecutive same-mode segments (max 9 stops per group)
    const groups = [];
    let groupOriginIdx = 0;
    for (let i = 1; i < locs.length; i++) {
      const mode = locs[i].transportMode || 'DRIVING';
      const isLast =
        i === locs.length - 1 ||
        (locs[i + 1]?.transportMode || 'DRIVING') !== mode ||
        i - groupOriginIdx >= 9;
      if (isLast) {
        groups.push({ mode, stops: locs.slice(groupOriginIdx, i + 1) });
        groupOriginIdx = i;
      }
    }

    const results = await Promise.all(
      groups.map(async ({ mode, stops }) => {
        const profile = OSRM_PROFILE[mode] || 'driving';
        const coords = stops.map((s) => `${s.longitude},${s.latitude}`).join(';');
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`
          );
          const data = await res.json();
          if (data.code === 'Ok' && data.routes?.[0]) {
            const positions = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            return { positions, color: getModeColor(mode), distance: data.routes[0].distance };
          }
        } catch {}
        // Fallback: straight lines
        return {
          positions: stops.map((s) => [s.latitude, s.longitude]),
          color: getModeColor(mode),
          distance: 0,
          isStraight: true,
        };
      })
    );

    if (fetchGenRef.current !== gen) return;
    setRouteSegments(results);
    const totalMeters = results.reduce((sum, r) => sum + (r.distance || 0), 0);
    setRouteDistance(totalMeters > 0 ? (totalMeters / 1000).toFixed(1) : null);
    setRouteError(results.some((r) => r.isStraight));
    setRouteLoading(false);
  }, []);

  // Re-fetch when locations change (only if route was previously requested)
  useEffect(() => {
    if (readOnly || !routeRequestedRef.current) return;
    setRouteSegments([]);
    const timer = setTimeout(() => fetchOSRMRoute(locationsRef.current), 500);
    return () => clearTimeout(timer);
  }, [locations, readOnly, fetchOSRMRoute]);

  const handleShowRoute = () => {
    routeRequestedRef.current = true;
    setRouteRequested(true);
    fetchOSRMRoute(locationsRef.current);
  };

  // readOnly: straight lines, no API
  const displaySegments = readOnly
    ? locations.slice(1).map((dest, i) => ({
        positions: [
          [locations[i].latitude, locations[i].longitude],
          [dest.latitude, dest.longitude],
        ],
        color: getModeColor(dest.transportMode || 'DRIVING'),
      }))
    : routeSegments;

  const straightDistance = calculateTotalDistance(locations);
  const distanceLabel = routeDistance
    ? `총 이동 거리 ${routeDistance} km`
    : locations.length >= 2
    ? `총 이동 거리 ${straightDistance} km (직선)`
    : null;

  return (
    <Box ref={containerRef}>
      {/* Distance label + route button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        {distanceLabel && (
          <Box sx={{
            display: 'inline-flex', alignItems: 'center',
            px: 2, py: 0.75,
            bgcolor: 'primary.main', color: 'white',
            borderRadius: 2, fontSize: '0.875rem', fontWeight: 'bold',
          }}>
            {distanceLabel}
          </Box>
        )}
        {!readOnly && locations.length >= 2 && !routeRequested && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<RouteIcon />}
            onClick={handleShowRoute}
            disabled={routeLoading}
          >
            경로 표시
          </Button>
        )}
        {routeLoading && <CircularProgress size={18} />}
        {routeError && (
          <Typography variant="caption" color="text.secondary">
            일부 구간은 직선으로 표시됩니다
          </Typography>
        )}
      </Box>

      {/* Map */}
      <Box sx={{ width: '100%', height: { xs: 280, sm: 350, md: 420 }, borderRadius: '8px', overflow: 'hidden' }}>
        {isVisible ? (
          <MapContainer
            center={KOREA_CENTER}
            zoom={7}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <BoundsController locations={locations} />
            {locations.map((loc, i) => (
              <Marker
                key={loc.id ?? i}
                position={[loc.latitude, loc.longitude]}
                icon={createNumberedIcon(i + 1, selectedLocId === (loc.id ?? i))}
                eventHandlers={{
                  click: () => {
                    setSelectedLocId(loc.id ?? i);
                    onLocationSelect?.(loc);
                  },
                }}
              >
                <Popup>
                  <div>
                    <strong style={{ fontSize: '13px' }}>{loc.name}</strong><br />
                    <span style={{ fontSize: '11px', color: '#666' }}>
                      {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
            {displaySegments.map((seg, i) => (
              <Polyline key={i} positions={seg.positions} color={seg.color} weight={4} opacity={0.8} />
            ))}
          </MapContainer>
        ) : (
          <Box sx={{
            width: '100%', height: '100%', bgcolor: 'grey.100',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TripMap;
