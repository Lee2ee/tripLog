import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Alert, CircularProgress,
  FormControlLabel, Switch, Typography, Divider, Chip,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';

export const TRIP_TAGS = [
  '국내여행', '해외여행', '혼자', '커플', '가족', '친구',
  '봄', '여름', '가을', '겨울', '맛집투어', '자연/힐링', '역사/문화', '쇼핑',
];

const CreateTripDialog = ({ open, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    isPublic: false,
    tags: [],
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

  const toggleTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setSubmitError('');
    try {
      await onSubmit({ ...formData, tags: formData.tags });
      setFormData({ title: '', startDate: '', endDate: '', isPublic: false, tags: [] });
      setErrors({});
    } catch (error) {
      setSubmitError(error.response?.data?.message || '여행 생성에 실패했습니다');
    }
  };

  const handleClose = () => {
    setFormData({ title: '', startDate: '', endDate: '', isPublic: false, tags: [] });
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

          {/* 태그 선택 */}
          <Box>
            <Typography variant="body2" fontWeight="medium" mb={1}>
              태그 <Typography component="span" variant="caption" color="text.secondary">(선택사항)</Typography>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {TRIP_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  clickable
                  onClick={() => toggleTag(tag)}
                  color={formData.tags.includes(tag) ? 'primary' : 'default'}
                  variant={formData.tags.includes(tag) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* 공개 설정 */}
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
