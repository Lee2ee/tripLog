import React, { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
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

const MODE_COLOR = {
  DRIVING:   '#1976d2',
  WALKING:   '#388e3c',
  TRANSIT:   '#f57c00',
  BICYCLING: '#7b1fa2',
};

const getModeColor = (mode) => MODE_COLOR[mode] ?? '#1976d2';

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

const TripMap = ({ locations = [], onLocationSelect }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeError, setRouteError] = useState(false);

  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const renderersRef = useRef([]);
  const fallbackPolysRef = useRef([]);
  const fetchGenRef = useRef(0);
  const routeDebounceRef = useRef(null);

  const locationsRef = useRef(locations);
  locationsRef.current = locations;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    language: 'ko',
    region: 'KR',
  });

  // 모든 경로 오버레이 제거
  const clearRoute = useCallback(() => {
    renderersRef.current.forEach((r) => r.setMap(null));
    renderersRef.current = [];
    fallbackPolysRef.current.forEach((p) => p.setMap(null));
    fallbackPolysRef.current = [];
  }, []);

  // 세그먼트별 Directions API 호출
  const fetchRoute = useCallback((mapInstance, locs) => {
    clearRoute();
    setRouteError(false);

    if (!mapInstance || !window.google || locs.length < 2) {
      setRouteDistance(null);
      return;
    }

    const gen = ++fetchGenRef.current;

    const service = new window.google.maps.DirectionsService();
    const segments = locs.slice(1).map((dest, i) => ({
      origin: locs[i],
      dest,
      mode: dest.transportMode || 'DRIVING',
    }));

    let completed = 0;
    let totalMeters = 0;
    let hasError = false;

    segments.forEach(({ origin, dest, mode }) => {
      const color = getModeColor(mode);

      service.route(
        {
          origin: { lat: origin.latitude, lng: origin.longitude },
          destination: { lat: dest.latitude, lng: dest.longitude },
          travelMode: window.google.maps.TravelMode[mode],
        },
        (result, status) => {
          // 이미 새로운 fetchRoute가 호출됐으면 이 응답은 버림
          if (fetchGenRef.current !== gen) return;

          completed += 1;

          if (status === 'OK') {
            const renderer = new window.google.maps.DirectionsRenderer({
              map: mapInstance,
              directions: result,
              suppressMarkers: true,
              preserveViewport: true,  // fitBounds가 설정한 뷰포트를 덮어쓰지 않음
              polylineOptions: { strokeColor: color, strokeOpacity: 0.85, strokeWeight: 5 },
            });
            renderersRef.current.push(renderer);
            totalMeters += result.routes[0].legs[0].distance.value;
          } else {
            hasError = true;
            // 경로 없을 때 직선 fallback
            const poly = new window.google.maps.Polyline({
              map: mapInstance,
              path: [
                { lat: origin.latitude, lng: origin.longitude },
                { lat: dest.latitude, lng: dest.longitude },
              ],
              strokeColor: color,
              strokeOpacity: 0.5,
              strokeWeight: 3,
              geodesic: true,
            });
            fallbackPolysRef.current.push(poly);
          }

          if (completed === segments.length) {
            setRouteError(hasError);
            setRouteDistance(totalMeters > 0 ? (totalMeters / 1000).toFixed(1) : null);
          }
        }
      );
    });
  }, [clearRoute]);

  const handleMarkerClick = useCallback((loc) => {
    setSelectedMarker(loc);
    onLocationSelectRef.current?.(loc);
  }, []);

  const onMapLoad = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
    syncMarkers(mapInstance, locationsRef.current, markersRef, handleMarkerClick);
    fetchRoute(mapInstance, locationsRef.current);
    applyBounds(mapInstance, locationsRef.current);
  }, [fetchRoute, handleMarkerClick]);

  const onMapUnmount = useCallback(() => {
    clearRoute();
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    mapRef.current = null;
  }, [clearRoute]);

  // 장소 목록 변경 시 — 마커·경계는 즉시, 경로는 500ms 디바운스
  useEffect(() => {
    if (!mapRef.current) return;
    syncMarkers(mapRef.current, locations, markersRef, handleMarkerClick);
    applyBounds(mapRef.current, locations);

    if (routeDebounceRef.current) clearTimeout(routeDebounceRef.current);
    routeDebounceRef.current = setTimeout(() => {
      fetchRoute(mapRef.current, locations);
    }, 500);

    return () => {
      if (routeDebounceRef.current) clearTimeout(routeDebounceRef.current);
    };
  }, [locations, fetchRoute, handleMarkerClick]);

  const straightDistance = calculateTotalDistance(locations);
  const distanceLabel = routeDistance
    ? `총 이동 거리 ${routeDistance} km`
    : locations.length >= 2
    ? `총 이동 거리 ${straightDistance} km (직선)`
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

  return (
    <Box>
      {distanceLabel && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center',
              px: 2, py: 0.75,
              bgcolor: 'primary.main', color: 'white',
              borderRadius: 2, fontSize: '0.875rem', fontWeight: 'bold',
            }}
          >
            {distanceLabel}
          </Box>
          {routeError && (
            <Typography variant="caption" color="text.secondary">
              일부 구간 경로를 찾을 수 없어 직선으로 표시합니다
            </Typography>
          )}
        </Box>
      )}

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
