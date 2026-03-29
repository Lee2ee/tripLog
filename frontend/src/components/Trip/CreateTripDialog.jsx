import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Alert, CircularProgress,
  FormControlLabel, Switch, Typography, Divider,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';

const CreateTripDialog = ({ open, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    isPublic: false,
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
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setSubmitError('');
    try {
      await onSubmit(formData);
      setFormData({ title: '', startDate: '', endDate: '', isPublic: false });
      setErrors({});
    } catch (error) {
      setSubmitError(error.response?.data?.message || '여행 생성에 실패했습니다');
    }
  };

  const handleClose = () => {
    setFormData({ title: '', startDate: '', endDate: '', isPublic: false });
    setErrors({});
    setSubmitError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>새 여행 만들기</DialogTitle>
      <DialogContent>
        {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="여행 제목" name="title" value={formData.title} onChange={handleChange}
            error={!!errors.title} helperText={errors.title}
            fullWidth required autoFocus placeholder="예: 유럽 여름 여행"
          />
          <TextField
            label="시작일" name="startDate" type="date" value={formData.startDate} onChange={handleChange}
            error={!!errors.startDate} helperText={errors.startDate}
            fullWidth required InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="종료일" name="endDate" type="date" value={formData.endDate} onChange={handleChange}
            error={!!errors.endDate} helperText={errors.endDate}
            fullWidth required InputLabelProps={{ shrink: true }}
            inputProps={{ min: formData.startDate }}
          />
          <Divider />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {formData.isPublic
                ? <PublicIcon color="primary" fontSize="small" />
                : <LockIcon color="action" fontSize="small" />}
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {formData.isPublic ? '공개 여행' : '비공개 여행'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formData.isPublic
                    ? '누구나 이 여행을 탐색할 수 있습니다'
                    : '나와 초대된 멤버만 볼 수 있습니다'}
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={(e) => setFormData((p) => ({ ...p, isPublic: e.target.checked }))}
                  color="primary"
                />
              }
              label=""
              sx={{ m: 0 }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>취소</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : '만들기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTripDialog;
