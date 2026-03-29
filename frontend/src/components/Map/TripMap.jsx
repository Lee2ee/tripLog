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

// Marker/Polyline을 직접(imperative) 생성·갱신
const syncOverlays = (mapInstance, locs, markersRef, polylineRef, onMarkerClick) => {
  if (!mapInstance || !window.google) return;

  // 기존 마커 제거
  markersRef.current.forEach((m) => m.setMap(null));
  markersRef.current = [];

  // 새 마커 생성
  markersRef.current = locs.map((loc, index) => {
    const marker = new window.google.maps.Marker({
      map: mapInstance,
      position: { lat: loc.latitude, lng: loc.longitude },
      label: { text: String(index + 1), color: 'white', fontWeight: 'bold', fontSize: '13px' },
    });
    marker.addListener('click', () => onMarkerClick(loc));
    return marker;
  });

  // 폴리라인 갱신
  if (polylineRef.current) {
    polylineRef.current.setMap(null);
    polylineRef.current = null;
  }
  if (locs.length >= 2) {
    polylineRef.current = new window.google.maps.Polyline({
      map: mapInstance,
      path: locs.map((loc) => ({ lat: loc.latitude, lng: loc.longitude })),
      strokeColor: '#1976d2',
      strokeOpacity: 0.85,
      strokeWeight: 4,
      geodesic: true,
    });
  }
};

const TripMap = ({ locations = [] }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const locationsRef = useRef(locations);
  locationsRef.current = locations;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    language: 'ko',
    region: 'KR',
  });

  const onMapLoad = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
    syncOverlays(mapInstance, locationsRef.current, markersRef, polylineRef, setSelectedMarker);
    applyBounds(mapInstance, locationsRef.current);
  }, []);

  const onMapUnmount = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    mapRef.current = null;
  }, []);

  // locations 변경 시 오버레이 재생성
  useEffect(() => {
    if (!mapRef.current) return;
    syncOverlays(mapRef.current, locations, markersRef, polylineRef, setSelectedMarker);
    applyBounds(mapRef.current, locations);
  }, [locations]);

  const totalDistance = calculateTotalDistance(locations);

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
        {locations.length > 0 && (
          <Typography variant="body2" color="primary" mt={2}>
            장소 {locations.length}개 &mdash; 총 거리: {totalDistance} km
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {locations.length >= 2 && (
        <Box
          sx={{
            display: 'inline-flex', alignItems: 'center',
            px: 2, py: 0.75, mb: 1.5,
            bgcolor: 'primary.light', color: 'primary.contrastText',
            borderRadius: 2, fontSize: '0.875rem', fontWeight: 'bold',
          }}
        >
          총 이동 거리: {totalDistance} km
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
