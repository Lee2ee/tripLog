import React, { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import {
  Box, Typography, CircularProgress, Alert,
  ToggleButton, ToggleButtonGroup, Tooltip,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import { calculateTotalDistance } from './haversine';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const LIBRARIES = ['places'];
const KOREA_CENTER = { lat: 36.5, lng: 127.5 };
const containerStyle = { width: '100%', height: '450px', borderRadius: '8px' };
const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
};

const TRAVEL_MODES = [
  { value: 'DRIVING',   label: '자동차',   icon: <DirectionsCarIcon fontSize="small" />,     color: '#1976d2' },
  { value: 'WALKING',   label: '도보',     icon: <DirectionsWalkIcon fontSize="small" />,    color: '#388e3c' },
  { value: 'TRANSIT',   label: '대중교통', icon: <DirectionsTransitIcon fontSize="small" />, color: '#f57c00' },
  { value: 'BICYCLING', label: '자전거',   icon: <DirectionsBikeIcon fontSize="small" />,    color: '#7b1fa2' },
];

const applyBounds = (mapInstance, locs) => {
  if (!mapInstance || !window.google) return;
  if (locs.length === 0) {
    mapInstance.setCenter(KOREA_CENTER);
    mapInstance.setZoom(7);
  } else if (locs.length === 1) {
    mapInstance.setCenter({ lat: locs[0].latitude, lng: locs[0].longitude });
    mapInstance.setZoom(14);
  } else {
    const bounds = new window.google.maps.LatLngBounds();
    locs.forEach((loc) => bounds.extend({ lat: loc.latitude, lng: loc.longitude }));
    mapInstance.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  }
};

const syncMarkers = (mapInstance, locs, markersRef, onMarkerClick) => {
  markersRef.current.forEach((m) => m.setMap(null));
  markersRef.current = locs.map((loc, index) => {
    const marker = new window.google.maps.Marker({
      map: mapInstance,
      position: { lat: loc.latitude, lng: loc.longitude },
      label: { text: String(index + 1), color: 'white', fontWeight: 'bold', fontSize: '13px' },
      zIndex: 10,
    });
    marker.addListener('click', () => onMarkerClick(loc));
    return marker;
  });
};

const TripMap = ({ locations = [] }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [travelMode, setTravelMode] = useState('DRIVING');
  const [routeDistance, setRouteDistance] = useState(null); // Directions API 실제 거리
  const [routeError, setRouteError] = useState(false);      // 경로 조회 실패 여부

  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const rendererRef = useRef(null);   // DirectionsRenderer
  const fallbackPolyRef = useRef(null); // 직선 폴리라인 (fallback)
  const locationsRef = useRef(locations);
  const travelModeRef = useRef(travelMode);
  locationsRef.current = locations;
  travelModeRef.current = travelMode;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    language: 'ko',
    region: 'KR',
  });

  // DirectionsRenderer·폴리라인 제거
  const clearRoute = useCallback(() => {
    if (Array.isArray(rendererRef.current)) {
      rendererRef.current.forEach((r) => r.setMap(null));
    } else if (rendererRef.current) {
      rendererRef.current.setMap(null);
    }
    rendererRef.current = [];
    if (fallbackPolyRef.current) {
      fallbackPolyRef.current.setMap(null);
      fallbackPolyRef.current = null;
    }
  }, []);

  // 직선 폴리라인 (Directions API 실패 시 fallback)
  const drawFallbackPolyline = useCallback((mapInstance, locs, color) => {
    if (locs.length < 2) return;
    fallbackPolyRef.current = new window.google.maps.Polyline({
      map: mapInstance,
      path: locs.map((l) => ({ lat: l.latitude, lng: l.longitude })),
      strokeColor: color,
      strokeOpacity: 0.6,
      strokeWeight: 3,
      geodesic: true,
    });
  }, []);

  // 세그먼트별 Directions API 호출 → 이동 수단별 실제 경로
  const fetchRoute = useCallback((mapInstance, locs, globalMode) => {
    clearRoute();
    setRouteError(false);

    if (!mapInstance || !window.google || locs.length < 2) {
      setRouteDistance(null);
      return;
    }

    const service = new window.google.maps.DirectionsService();
    let totalMeters = 0;
    let pendingCount = locs.length - 1;
    let hasError = false;

    locs.slice(1).forEach((dest, i) => {
      const origin = locs[i];
      // 장소에 저장된 이동 수단 우선, 없으면 글로벌 선택 값 사용
      const segMode = dest.transportMode || globalMode;
      const modeConfig = TRAVEL_MODES.find((m) => m.value === segMode);
      const color = modeConfig?.color ?? '#1976d2';

      service.route(
        {
          origin: { lat: origin.latitude, lng: origin.longitude },
          destination: { lat: dest.latitude, lng: dest.longitude },
          travelMode: window.google.maps.TravelMode[segMode],
        },
        (result, status) => {
          pendingCount -= 1;
          if (status === 'OK') {
            const renderer = new window.google.maps.DirectionsRenderer({
              map: mapInstance,
              directions: result,
              suppressMarkers: true,
              polylineOptions: { strokeColor: color, strokeOpacity: 0.85, strokeWeight: 5 },
            });
            rendererRef.current = renderer; // 마지막 renderer 참조 유지 (cleanup용)
            // 여러 renderer를 배열로 관리
            if (!Array.isArray(rendererRef.current)) rendererRef.current = [];
            if (Array.isArray(rendererRef.current)) rendererRef.current.push(renderer);
            totalMeters += result.routes[0].legs[0].distance.value;
          } else {
            hasError = true;
            drawFallbackPolyline(mapInstance, [origin, dest], color);
          }

          if (pendingCount === 0) {
            setRouteError(hasError);
            setRouteDistance(totalMeters > 0 ? (totalMeters / 1000).toFixed(1) : null);
          }
        }
      );
    });
  }, [clearRoute, drawFallbackPolyline]);

  const onMapLoad = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
    syncMarkers(mapInstance, locationsRef.current, markersRef, setSelectedMarker);
    fetchRoute(mapInstance, locationsRef.current, travelModeRef.current);
    applyBounds(mapInstance, locationsRef.current);
  }, [fetchRoute]);

  const onMapUnmount = useCallback(() => {
    clearRoute();
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    mapRef.current = null;
  }, [clearRoute]);

  // locations 변경 (장소 추가/삭제)
  useEffect(() => {
    if (!mapRef.current) return;
    syncMarkers(mapRef.current, locations, markersRef, setSelectedMarker);
    fetchRoute(mapRef.current, locations, travelModeRef.current);
    applyBounds(mapRef.current, locations);
  }, [locations, fetchRoute]);

  // 이동 수단 변경
  useEffect(() => {
    if (!mapRef.current) return;
    fetchRoute(mapRef.current, locationsRef.current, travelMode);
  }, [travelMode, fetchRoute]);

  const straightDistance = calculateTotalDistance(locations);
  const distanceLabel = routeDistance
    ? `총 ${routeDistance} km`
    : locations.length >= 2
    ? `${straightDistance} km (직선)`
    : null;

  if (loadError) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Google 지도를 불러오지 못했습니다. API 키 설정을 확인해주세요.
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Box
        sx={{
          height: 200, bgcolor: 'grey.100', borderRadius: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', border: '2px dashed', borderColor: 'grey.300', p: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary" fontWeight="bold">
          Google Maps API 키가 필요합니다
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
          .env 파일에 VITE_GOOGLE_MAPS_API_KEY를 설정해주세요.
        </Typography>
      </Box>
    );
  }

  const activeMode = TRAVEL_MODES.find((m) => m.value === travelMode);

  return (
    <Box>
      {/* 이동 수단 선택 + 거리 표시 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={travelMode}
          exclusive
          onChange={(_, v) => { if (v) setTravelMode(v); }}
          size="small"
          sx={{ bgcolor: 'background.paper' }}
        >
          {TRAVEL_MODES.map((mode) => (
            <Tooltip key={mode.value} title={mode.label} arrow>
              <ToggleButton
                value={mode.value}
                sx={{
                  px: 1.5,
                  '&.Mui-selected': { color: mode.color, borderColor: mode.color },
                }}
              >
                {mode.icon}
              </ToggleButton>
            </Tooltip>
          ))}
        </ToggleButtonGroup>

        {distanceLabel && (
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              px: 2, py: 0.75,
              bgcolor: 'primary.main', color: 'white',
              borderRadius: 2, fontSize: '0.875rem', fontWeight: 'bold',
            }}
          >
            {distanceLabel}
          </Box>
        )}

        {routeError && (
          <Typography variant="caption" color="text.secondary">
            경로를 찾을 수 없어 직선으로 표시합니다
          </Typography>
        )}
      </Box>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={KOREA_CENTER}
        zoom={7}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
      >
        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">{selectedMarker.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedMarker.latitude.toFixed(6)}, {selectedMarker.longitude.toFixed(6)}
              </Typography>
            </Box>
          </InfoWindow>
        )}
      </GoogleMap>
    </Box>
  );
};

export default TripMap;
