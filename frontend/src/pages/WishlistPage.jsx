import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Paper, CircularProgress, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tooltip, Chip, Snackbar, Autocomplete,
} from '@mui/material';
import axiosInstance from '../api/axios';
import { searchPlaces } from '../api/placeSearch';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const EMPTY_FORM = { name: '', latitude: '', longitude: '', address: '', memo: '' };

const WishlistPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [snackbar, setSnackbar] = useState('');

  const [acKey, setAcKey] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchInput.trim() || searchInput.length < 2) {
      setSearchOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchPlaces(searchInput);
        setSearchOptions(results);
      } catch {
        setSearchOptions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/wishlists');
      setItems(res.data.data);
    } catch {
      setError('위시리스트를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = '장소명을 입력하세요.';
    if (form.latitude === '' || form.longitude === '') errors.latitude = '장소를 검색하여 선택해주세요.';
    return errors;
  };

  const handleAdd = async () => {
    const errors = validate();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setSaving(true);
    try {
      await axiosInstance.post('/wishlists', {
        name: form.name.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        address: form.address.trim(),
        memo: form.memo.trim(),
      });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
      fetchItems();
      setSnackbar('위시리스트에 추가되었습니다.');
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || '추가에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await axiosInstance.delete(`/wishlists/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSnackbar('삭제되었습니다.');
    } catch {
      setSnackbar('삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenDialog = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSearchInput('');
    setSearchOptions([]);
    setAcKey((k) => k + 1);
    setDialogOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">위시리스트</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          장소 추가
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {items.length === 0 ? (
        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, p: 4, textAlign: 'center' }}>
          <BookmarkIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography color="text.secondary">가고 싶은 장소를 추가해보세요.</Typography>
        </Paper>
      ) : (
        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
          <List disablePadding>
            {items.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <Divider />}
                <ListItem sx={{ px: 2, py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mr: 1, flexShrink: 0, pt: 0.25 }}>
                    <LocationOnIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Typography fontWeight="medium" sx={{ wordBreak: 'break-word' }}>{item.name}</Typography>
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        {item.address && (
                          <Box component="span" sx={{ display: 'block', fontSize: '0.75rem' }}>{item.address}</Box>
                        )}
                        {item.memo && (
                          <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', fontStyle: 'italic', color: 'text.secondary' }}>{item.memo}</Box>
                        )}
                        <Chip label={formatDate(item.createdAt)} size="small" sx={{ mt: 0.5, height: 18, fontSize: '0.7rem' }} />
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'span' }}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="삭제">
                      <span>
                        <IconButton
                          edge="end"
                          size="small"
                          color="error"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>장소 추가</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {formErrors.submit && <Alert severity="error">{formErrors.submit}</Alert>}

            <Autocomplete
              key={acKey}
              options={searchOptions}
              getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.name || ''}
              filterOptions={(x) => x}
              loading={searchLoading}
              noOptionsText={searchInput.length < 2 ? '2글자 이상 입력하세요' : '검색 결과 없음'}
              onInputChange={(_, val, reason) => {
                if (reason === 'input' || reason === 'clear') setSearchInput(val);
              }}
              onChange={(_, opt) => {
                if (!opt) { setForm((prev) => ({ ...prev, name: '', latitude: '', longitude: '', address: '' })); return; }
                setForm((prev) => ({
                  ...prev,
                  name: opt.name,
                  latitude: opt.lat,
                  longitude: opt.lng,
                  address: opt.detail,
                }));
                setFormErrors((prev) => ({ ...prev, name: '', latitude: '' }));
              }}
              renderOption={(props, opt) => (
                <li {...props} key={opt.id}>
                  <Box sx={{ overflow: 'hidden', width: '100%' }}>
                    <Typography variant="body2" fontWeight={500}>{opt.name}</Typography>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.detail}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="장소 검색"
                  fullWidth
                  size="small"
                  placeholder="장소명 또는 주소 검색"
                  error={!!formErrors.name || !!formErrors.latitude}
                  helperText={formErrors.name || formErrors.latitude}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {searchLoading ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {form.address && (
              <TextField
                label="주소"
                fullWidth
                size="small"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            )}

            <TextField
              label="메모 (선택)"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={form.memo}
              onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
              inputProps={{ maxLength: 200 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleAdd} disabled={saving}>추가</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default WishlistPage;
