import React, { useState, useRef, useCallback } from 'react';
import {
  Box, TextField, Button, Paper, Typography, CircularProgress,
  Alert, Divider, MenuItem, Chip,
} from '@mui/material';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import SearchIcon from '@mui/icons-material/Search';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const LIBRARIES = ['places'];

const CATEGORIES = [
  { value: '관광지', emoji: '🏛️' },
  { value: '맛집',  emoji: '🍽️' },
  { value: '쇼핑',  emoji: '🛍️' },
  { value: '숙박',  emoji: '🏨' },
  { value: '교통',  emoji: '🚉' },
  { value: '기타',  emoji: '📍' },
];

const AddLocationForm = ({ tripId, dayId, onLocationAdded, existingCount = 0 }) => {
  const autocompleteRef = useRef(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [memo, setMemo] = useState('');
  const [pin, setPin] = useState(null); // { lat, lng }
  const [nameError, setNameError] = useState('');
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    language: 'ko',
    region: 'KR',
  });

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    setPin({ lat, lng });
    setName(place.name || '');
    setPinError('');
    setNameError('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;
    if (!name.trim()) { setNameError('장소 이름을 입력해주세요'); valid = false; }
    if (!pin) { setPinError('장소를 검색해서 선택해주세요'); valid = false; }
    if (!valid) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await onLocationAdded({
        name: name.trim(),
        latitude: pin.lat,
        longitude: pin.lng,
        orderIndex: existingCount + 1,
        category: category || null,
        memo: memo.trim() || null,
      });
      setSuccessMsg(`"${name}" 장소가 추가되었습니다!`);
      setName('');
      setCategory('');
      setMemo('');
      setPin(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || '장소 추가에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <AddLocationAltIcon color="primary" />
        <Typography variant="subtitle1" fontWeight="bold">장소 추가</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

          {/* Google Places 검색 */}
          {isLoaded ? (
            <Autocomplete
              onLoad={(ac) => { autocompleteRef.current = ac; }}
              onPlaceChanged={onPlaceChanged}
              options={{ fields: ['name', 'geometry'] }}
            >
              <TextField
                label="장소 검색"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(''); setPin(null); }}
                error={!!nameError || !!pinError}
                helperText={nameError || pinError || 'Google에서 장소를 검색하면 좌표가 자동 입력됩니다'}
                size="small"
                fullWidth
                placeholder="예: 경복궁, 명동 칼국수..."
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
                }}
              />
            </Autocomplete>
          ) : (
            <TextField
              label="장소 이름"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              error={!!nameError}
              helperText={nameError}
              size="small"
              fullWidth
              placeholder="예: 경복궁"
            />
          )}

          {/* 선택된 좌표 표시 */}
          {pin && (
            <Chip
              label={`📌 ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ alignSelf: 'flex-start', fontFamily: 'monospace' }}
            />
          )}

          {/* 카테고리 */}
          <TextField
            select
            label="카테고리 (선택)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            size="small"
            fullWidth
          >
            <MenuItem value=""><em>없음</em></MenuItem>
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>{cat.emoji} {cat.value}</MenuItem>
            ))}
          </TextField>

          {/* 메모 */}
          <TextField
            label="메모 (선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={2}
            placeholder="예: 예약 필수, 웨이팅 있음, 주차 가능..."
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading || !pin}
            startIcon={loading ? <CircularProgress size={16} /> : <AddLocationAltIcon />}
            sx={{ alignSelf: 'flex-start' }}
          >
            {loading ? '추가 중...' : '장소 추가'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default AddLocationForm;
