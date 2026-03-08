import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';

const AddLocationForm = ({ tripId, dayId, onLocationAdded, existingCount = 0 }) => {
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    orderIndex: existingCount + 1,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = '장소 이름을 입력해주세요';

    const lat = parseFloat(formData.latitude);
    if (!formData.latitude) newErrors.latitude = '위도를 입력해주세요';
    else if (isNaN(lat) || lat < -90 || lat > 90)
      newErrors.latitude = '위도는 -90 ~ 90 사이여야 합니다';

    const lng = parseFloat(formData.longitude);
    if (!formData.longitude) newErrors.longitude = '경도를 입력해주세요';
    else if (isNaN(lng) || lng < -180 || lng > 180)
      newErrors.longitude = '경도는 -180 ~ 180 사이여야 합니다';

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        orderIndex: parseInt(formData.orderIndex),
      };
      await onLocationAdded(payload);
      setSuccessMsg(`"${formData.name}" 장소가 추가되었습니다!`);
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        orderIndex: existingCount + 2,
      });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || '장소 추가에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <AddLocationAltIcon color="primary" />
        <Typography variant="subtitle1" fontWeight="bold">
          장소 추가
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="장소 이름"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            size="small"
            fullWidth
            placeholder="예: 경복궁"
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="위도"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              error={!!errors.latitude}
              helperText={errors.latitude}
              size="small"
              type="number"
              inputProps={{ step: 'any', min: -90, max: 90 }}
              placeholder="예: 37.5796"
              fullWidth
            />
            <TextField
              label="경도"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              error={!!errors.longitude}
              helperText={errors.longitude}
              size="small"
              type="number"
              inputProps={{ step: 'any', min: -180, max: 180 }}
              placeholder="예: 126.9770"
              fullWidth
            />
          </Box>
          <TextField
            label="순서"
            name="orderIndex"
            value={formData.orderIndex}
            onChange={handleChange}
            size="small"
            type="number"
            inputProps={{ min: 1 }}
            sx={{ width: 100 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <AddLocationAltIcon />}
            sx={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}
          >
            {loading ? '추가 중...' : '장소 추가'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default AddLocationForm;
