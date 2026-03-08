import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { calculateTotalDistance } from './haversine';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const containerStyle = {
  width: '100%',
  height: '450px',
  borderRadius: '8px',
};

const defaultCenter = { lat: 37.5665, lng: 126.9780 }; // 서울

const TripMap = ({ locations = [] }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;

    if (locations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach((loc) => {
        bounds.extend({ lat: loc.latitude, lng: loc.longitude });
      });
      map.fitBounds(bounds);
      if (locations.length === 1) {
        map.setZoom(14);
      }
    }
  }, [locations]);

  const mapCenter =
    locations.length > 0
      ? { lat: locations[0].latitude, lng: locations[0].longitude }
      : defaultCenter;

  const polylinePath = locations.map((loc) => ({
    lat: loc.latitude,
    lng: loc.longitude,
  }));

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
          height: 200,
          bgcolor: 'grey.100',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed',
          borderColor: 'grey.300',
          p: 3,
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
            display: 'inline-flex',
            alignItems: 'center',
            px: 2,
            py: 0.75,
            mb: 1.5,
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            borderRadius: 2,
            fontSize: '0.875rem',
            fontWeight: 'bold',
          }}
        >
          총 이동 거리: {totalDistance} km
        </Box>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={locations.length === 0 ? 6 : 12}
        onLoad={onMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {locations.map((loc, index) => (
          <Marker
            key={loc.id || index}
            position={{ lat: loc.latitude, lng: loc.longitude }}
            label={{
              text: String(index + 1),
              color: 'white',
              fontWeight: 'bold',
              fontSize: '13px',
            }}
            onClick={() => setSelectedMarker(loc)}
          />
        ))}

        {polylinePath.length >= 2 && (
          <Polyline
            path={polylinePath}
            options={{
              strokeColor: '#1976d2',
              strokeOpacity: 0.85,
              strokeWeight: 4,
              geodesic: true,
            }}
          />
        )}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {selectedMarker.name}
              </Typography>
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
