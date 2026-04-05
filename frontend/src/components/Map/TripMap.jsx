import React, { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { calculateTotalDistance } from './haversine';
import RouteIcon from '@mui/icons-material/Route';
import { trackApiCall } from '../../utils/mapsUsageTracker';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const LIBRARIES = ['places'];
const KOREA_CENTER = { lat: 36.5, lng: 127.5 };
const containerStyle = { width: '100%', height: '100%', borderRadius: '8px' };
const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
};

// Directions API는 세그먼트 수가 이 값 이하일 때만 호출
const MAX_DIRECTIONS_SEGMENTS = 5;

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

// 직선 폴리라인 그리기 (Directions API 대체)
const drawStraightLines = (mapInstance, locs, fallbackPolysRef) => {
  fallbackPolysRef.current.forEach((p) => p.setMap(null));
  fallbackPolysRef.current = [];

  locs.slice(1).forEach((dest, i) => {
    const origin = locs[i];
    const color = getModeColor(dest.transportMode || 'DRIVING');
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
  });
};

/**
 * @param {object[]} locations
 * @param {function} onLocationSelect
 * @param {boolean}  readOnly  true이면 Directions API 미호출, 직선만 표시
 */
const TripMap = ({ locations = [], onLocationSelect, readOnly = false }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;

  const [routeDistance, setRouteDistance] = useState(null);
  const [routeError, setRouteError] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  // Intersection Observer: 뷰포트에 들어올 때만 지도 렌더링
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const renderersRef = useRef([]);
  const fallbackPolysRef = useRef([]);
  const fetchGenRef = useRef(0);
  const routeDebounceRef = useRef(null);

  // 경로 on-demand: 사용자가 버튼을 눌렀는지 여부 (ref로 관리해 클로저 문제 방지)
  const routeRequestedRef = useRef(false);
  const [routeRequested, setRouteRequested] = useState(false);

  const locationsRef = useRef(locations);
  locationsRef.current = locations;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    language: 'ko',
    region: 'KR',
  });

  const clearRoute = useCallback(() => {
    renderersRef.current.forEach((r) => r.setMap(null));
    renderersRef.current = [];
    fallbackPolysRef.current.forEach((p) => p.setMap(null));
    fallbackPolysRef.current = [];
  }, []);

  const fetchRoute = useCallback((mapInstance, locs) => {
    clearRoute();
    setRouteError(false);

    if (!mapInstance || !window.google || locs.length < 2) {
      setRouteDistance(null);
      return;
    }

    const gen = ++fetchGenRef.current;
    const segments = locs.slice(1).map((dest, i) => ({
      origin: locs[i],
      dest,
      mode: dest.transportMode || 'DRIVING',
    }));

    // ① readOnly이거나 세그먼트 수 초과 → 직선만 표시, Directions API 호출 안 함
    if (readOnly || segments.length > MAX_DIRECTIONS_SEGMENTS) {
      drawStraightLines(mapInstance, locs, fallbackPolysRef);
      setRouteDistance(null); // 직선 거리는 하단 straightDistance로 표시
      return;
    }

    // ② 경로 미요청 상태 → 마커만 표시
    if (!routeRequestedRef.current) return;

    // ③ Directions API 호출
    setRouteLoading(true);
    const service = new window.google.maps.DirectionsService();
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
          if (fetchGenRef.current !== gen) return;
          completed += 1;

          if (status === 'OK') {
            const renderer = new window.google.maps.DirectionsRenderer({
              map: mapInstance,
              directions: result,
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: { strokeColor: color, strokeOpacity: 0.85, strokeWeight: 5 },
            });
            renderersRef.current.push(renderer);
            totalMeters += result.routes[0].legs[0].distance.value;
          } else {
            hasError = true;
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
            setRouteLoading(false);
            setRouteError(hasError);
            setRouteDistance(totalMeters > 0 ? (totalMeters / 1000).toFixed(1) : null);
            trackApiCall('DIRECTIONS', segments.length);
          }
        }
      );
    });
  }, [clearRoute, readOnly]);

  const handleShowRoute = useCallback(() => {
    routeRequestedRef.current = true;
    setRouteRequested(true);
    if (mapRef.current) fetchRoute(mapRef.current, locationsRef.current);
  }, [fetchRoute]);

  const handleMarkerClick = useCallback((loc) => {
    setSelectedMarker(loc);
    onLocationSelectRef.current?.(loc);
  }, []);

  const onMapLoad = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
    syncMarkers(mapInstance, locationsRef.current, markersRef, handleMarkerClick);
    fetchRoute(mapInstance, locationsRef.current);
    applyBounds(mapInstance, locationsRef.current);
    trackApiCall('MAP_LOAD', 1);
  }, [fetchRoute, handleMarkerClick]);

  const onMapUnmount = useCallback(() => {
    clearRoute();
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    mapRef.current = null;
  }, [clearRoute]);

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
  const segmentCount = Math.max(0, locations.length - 1);
  const isOverThreshold = !readOnly && segmentCount > MAX_DIRECTIONS_SEGMENTS;

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
    <Box ref={containerRef}>
      {/* 거리 표시 + 경로 버튼 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        {distanceLabel && (
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
        )}

        {/* 경로 표시 버튼: readOnly가 아니고 임계값 이하일 때만 표시 */}
        {!readOnly && !isOverThreshold && locations.length >= 2 && !routeRequested && (
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
            일부 구간 경로를 찾을 수 없어 직선으로 표시합니다
          </Typography>
        )}

        {isOverThreshold && (
          <Typography variant="caption" color="text.secondary">
            장소가 많아 직선으로 표시합니다 ({segmentCount}/{MAX_DIRECTIONS_SEGMENTS} 구간 초과)
          </Typography>
        )}
      </Box>

      {/* 지도: 뷰포트에 들어올 때만 렌더링 (Intersection Observer) */}
      <Box sx={{ width: '100%', height: { xs: 280, sm: 350, md: 420 }, borderRadius: '8px', overflow: 'hidden' }}>
        {isVisible && isLoaded ? (
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
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TripMap;
