import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';

const CreateTripDialog = ({ open, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = '여행 제목을 입력해주세요';
    if (!formData.startDate) newErrors.startDate = '시작일을 선택해주세요';
    if (!formData.endDate) newErrors.endDate = '종료일을 선택해주세요';
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = '종료일은 시작일 이후여야 합니다';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitError('');
    try {
      await onSubmit(formData);
      setFormData({ title: '', startDate: '', endDate: '' });
      setErrors({});
    } catch (error) {
      setSubmitError(error.response?.data?.message || '여행 생성에 실패했습니다');
    }
  };

  const handleClose = () => {
    setFormData({ title: '', startDate: '', endDate: '' });
    setErrors({});
    setSubmitError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>새 여행 만들기</DialogTitle>
      <DialogContent>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="여행 제목"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            required
            autoFocus
            placeholder="예: 유럽 여름 여행"
          />
          <TextField
            label="시작일"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            error={!!errors.startDate}
            helperText={errors.startDate}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="종료일"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            error={!!errors.endDate}
            helperText={errors.endDate}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: formData.startDate }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : '만들기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTripDialog;
