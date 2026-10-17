import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Paper, Typography, CircularProgress,
  Alert, Divider, MenuItem, Chip, ToggleButtonGroup, ToggleButton, Tooltip,
  Autocomplete,
} from '@mui/material';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import SearchIcon from '@mui/icons-material/Search';
import PinDropIcon from '@mui/icons-material/PinDrop';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';

const TRANSPORT_MODES = [
  { value: 'DRIVING',   label: '자동차',   icon: <DirectionsCarIcon fontSize="small" />,     color: '#1976d2' },
  { value: 'WALKING',   label: '도보',     icon: <DirectionsWalkIcon fontSize="small" />,    color: '#388e3c' },
  { value: 'TRANSIT',   label: '대중교통', icon: <DirectionsTransitIcon fontSize="small" />, color: '#f57c00' },
  { value: 'BICYCLING', label: '자전거',   icon: <DirectionsBikeIcon fontSize="small" />,    color: '#7b1fa2' },
];

const CATEGORIES = [
  { value: '관광지', emoji: '🏛️' },
  { value: '맛집',  emoji: '🍽️' },
  { value: '쇼핑',  emoji: '🛍️' },
  { value: '숙박',  emoji: '🏨' },
  { value: '교통',  emoji: '🚉' },
  { value: '기타',  emoji: '📍' },
];

const AddLocationForm = ({ tripId, dayId, onLocationAdded, existingCount = 0 }) => {
  const [acKey, setAcKey] = useState(0);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [memo, setMemo] = useState('');
  const [transportMode, setTransportMode] = useState('DRIVING');
  const [pin, setPin] = useState(null);
  const [nameError, setNameError] = useState('');
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [inputMode, setInputMode] = useState('search'); // 'search' | 'manual'
  const [searchInput, setSearchInput] = useState('');
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [manualCoord, setManualCoord] = useState('');
  const [manualCoordError, setManualCoordError] = useState('');

  const parseCoord = (str) => {
    const parts = str.split(',').map((s) => s.trim());
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  };

  const switchMode = (mode) => {
    setInputMode(mode);
    setName(''); setPin(null);
    setManualCoord(''); setManualCoordError('');
    setNameError(''); setPinError('');
    setAcKey((k) => k + 1);
  };

  const handleManualCoordChange = (e) => {
    const val = e.target.value;
    setManualCoord(val);
    if (!val.trim()) { setPin(null); setManualCoordError(''); return; }
    const parsed = parseCoord(val);
    if (parsed) { setPin(parsed); setManualCoordError(''); setPinError(''); }
    else { setPin(null); setManualCoordError('올바른 형식이 아닙니다 (예: 33.5917, 130.4004)'); }
  };

  useEffect(() => {
    if (!searchInput.trim() || searchInput.length < 2) {
      setSearchOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(searchInput)}&limit=6&lang=ko`
        );
        const data = await res.json();
        setSearchOptions(data.features || []);
      } catch {
        setSearchOptions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
        transportMode: existingCount > 0 ? transportMode : null,
      });
      setSuccessMsg(`"${name}" 장소가 추가되었습니다!`);
      setName('');
      setCategory('');
      setMemo('');
      setPin(null);
      setSearchInput('');
      setSearchOptions([]);
      setManualCoord('');
      setManualCoordError('');
      setAcKey((k) => k + 1);
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

          {/* 입력 모드 토글 */}
          <ToggleButtonGroup value={inputMode} exclusive onChange={(_, v) => { if (v) switchMode(v); }} size="small">
            <ToggleButton value="search" sx={{ px: 1.5, gap: 0.5, fontSize: '0.72rem' }}>
              <SearchIcon sx={{ fontSize: 15 }} /> 검색
            </ToggleButton>
            <ToggleButton value="manual" sx={{ px: 1.5, gap: 0.5, fontSize: '0.72rem' }}>
              <PinDropIcon sx={{ fontSize: 15 }} /> 직접 입력
            </ToggleButton>
          </ToggleButtonGroup>

          {inputMode === 'manual' && (
            <>
              <TextField
                label="장소 이름"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(''); }}
                error={!!nameError}
                helperText={nameError}
                size="small"
                fullWidth
                placeholder="예: 봄바키친"
              />
              <TextField
                label="좌표 붙여넣기"
                value={manualCoord}
                onChange={handleManualCoordChange}
                error={!!manualCoordError || !!pinError}
                helperText={manualCoordError || pinError || '구글 맵 우클릭 → 좌표 복사 (예: 33.5917, 130.4004)'}
                size="small"
                fullWidth
                placeholder="33.5917, 130.4004"
              />
            </>
          )}

          {inputMode === 'search' && <Autocomplete
            key={acKey}
            options={searchOptions}
            getOptionLabel={(opt) => {
              if (typeof opt === 'string') return opt;
              const p = opt.properties;
              return [p.name, p.city, p.country].filter(Boolean).join(', ');
            }}
            filterOptions={(x) => x}
            loading={searchLoading}
            noOptionsText={searchInput.length < 2 ? '2글자 이상 입력하세요' : '검색 결과 없음'}
            onInputChange={(_, val, reason) => {
              if (reason === 'input' || reason === 'clear') setSearchInput(val);
            }}
            onChange={(_, opt) => {
              if (!opt) { setPin(null); setName(''); return; }
              const [lng, lat] = opt.geometry.coordinates;
              setPin({ lat, lng });
              setName(opt.properties.name || '');
              setPinError('');
              setNameError('');
            }}
            renderOption={(props, opt) => {
              const p = opt.properties;
              const detail = [p.city, p.state, p.country].filter(Boolean).join(', ');
              return (
                <li {...props} key={`${p.osm_id}-${p.osm_type}`}>
                  <Box sx={{ overflow: 'hidden', width: '100%' }}>
                    <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {detail}
                    </Typography>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="장소 검색"
                size="small"
                placeholder="예: 경복궁, 에펠탑..."
                error={!!nameError || !!pinError}
                helperText={nameError || pinError || '장소를 검색하면 좌표가 자동 입력됩니다'}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />}

          {pin && (
            <Chip
              label={`📌 ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ alignSelf: 'flex-start', fontFamily: 'monospace' }}
            />
          )}

          {existingCount > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                이전 장소에서 이동 수단
              </Typography>
              <ToggleButtonGroup
                value={transportMode}
                exclusive
                onChange={(_, v) => { if (v) setTransportMode(v); }}
                size="small"
                sx={{ flexWrap: 'wrap' }}
              >
                {TRANSPORT_MODES.map((mode) => (
                  <Tooltip key={mode.value} title={mode.label} arrow>
                    <ToggleButton
                      value={mode.value}
                      sx={{
                        px: 1.5, gap: 0.5,
                        '&.Mui-selected': { color: mode.color, borderColor: mode.color },
                      }}
                    >
                      {mode.icon}
                      <Typography variant="caption">{mode.label}</Typography>
                    </ToggleButton>
                  </Tooltip>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

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
