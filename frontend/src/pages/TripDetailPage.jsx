import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, Tabs, Tab, CircularProgress, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, ListItemAvatar,
  Avatar, IconButton, Chip, Paper, Divider, Breadcrumbs, Link, Tooltip,
  TextField, Button, Stack, Badge, Drawer,
  Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButton, ToggleButtonGroup, MenuItem, Snackbar,
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axiosInstance from '../api/axios';
import TripMap from '../components/Map/TripMap';
import AddLocationForm from '../components/Trip/AddLocationForm';
import { getUser } from '../store/authStore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { TRIP_TAGS } from '../components/Trip/CreateTripDialog';

const TRANSPORT_ICONS = {
  DRIVING:   { icon: <DirectionsCarIcon sx={{ fontSize: 14 }} />,     color: '#1976d2', label: '자동차' },
  WALKING:   { icon: <DirectionsWalkIcon sx={{ fontSize: 14 }} />,    color: '#388e3c', label: '도보' },
  TRANSIT:   { icon: <DirectionsTransitIcon sx={{ fontSize: 14 }} />, color: '#f57c00', label: '대중교통' },
  BICYCLING: { icon: <DirectionsBikeIcon sx={{ fontSize: 14 }} />,    color: '#7b1fa2', label: '자전거' },
};

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

/* ── 장소 수정 다이얼로그 ── */
const EditLocationDialog = ({ open, loc, isFirst, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [memo, setMemo] = useState('');
  const [transportMode, setTransportMode] = useState('DRIVING');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loc) {
      setName(loc.name || '');
      setCategory(loc.category || '');
      setMemo(loc.memo || '');
      setTransportMode(loc.transportMode || 'DRIVING');
      setError('');
    }
  }, [loc, open]);

  const handleSave = async () => {
    if (!name.trim()) { setError('장소 이름을 입력해주세요.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(loc.id, {
        name: name.trim(),
        latitude: loc.latitude,
        longitude: loc.longitude,
        orderIndex: loc.orderIndex,
        category: category || null,
        memo: memo.trim() || null,
        transportMode: isFirst ? null : transportMode,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || '수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!loc) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>장소 수정</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        {error && <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>}

        <TextField
          label="장소 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
          fullWidth
          autoFocus
        />

        <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', fontFamily: 'monospace' }}>
          📍 {loc.latitude?.toFixed(6)}, {loc.longitude?.toFixed(6)}
        </Box>

        {!isFirst && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              이전 장소에서 이동 수단
            </Typography>
            <ToggleButtonGroup
              value={transportMode}
              exclusive
              onChange={(_, v) => { if (v) setTransportMode(v); }}
              size="small"
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
          placeholder="예: 예약 필수, 주차 가능..."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>취소</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ── 장소 이미지 갤러리 (Drawer) ── */
const LocationGalleryPanel = ({ locations, selectedLocId, canEdit, onImageUploaded, onImageDeleted, onClose }) => {
  const [uploading, setUploading] = React.useState(false);
  const [enlarged, setEnlarged] = React.useState(null);

  const selectedLoc = locations.find((l) => l.id === selectedLocId) || null;
  const images = selectedLoc?.images || [];

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedLoc) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosInstance.post(
        `/locations/${selectedLoc.id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      onImageUploaded(selectedLoc.id, res.data.data);
    } catch { /* ignore */ } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('이 사진을 삭제하시겠습니까?')) return;
    try {
      await axiosInstance.delete(`/locations/${selectedLoc.id}/images/${imageId}`);
      onImageDeleted(selectedLoc.id, imageId);
    } catch { /* ignore */ }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={!!selectedLocId}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 340 },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* 헤더 */}
        <Box sx={{
          px: 2, py: 1.5,
          display: 'flex', alignItems: 'center', gap: 1.5,
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 60%, #42a5f5 100%)',
          color: 'white',
          flexShrink: 0,
        }}>
          <PhotoCameraIcon sx={{ fontSize: 20 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight="bold" noWrap>
              {selectedLoc?.name || ''}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              사진 {images.length}장
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 이미지 그리드 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
          {images.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
              {images.map((img) => (
                <Box key={img.id} sx={{ position: 'relative', aspectRatio: '1', borderRadius: 1.5, overflow: 'hidden', bgcolor: 'grey.100' }}>
                  <Box
                    component="img"
                    src={img.imageUrl}
                    alt=""
                    onClick={() => setEnlarged(img.imageUrl)}
                    sx={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      cursor: 'pointer', display: 'block',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.06)' },
                    }}
                  />
                  {canEdit && (
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(img.id)}
                      sx={{
                        position: 'absolute', top: 3, right: 3,
                        bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
                        width: 20, height: 20, p: 0,
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PhotoCameraIcon sx={{ fontSize: 52, color: 'grey.200', mb: 1.5 }} />
              <Typography variant="body2" color="text.disabled">사진이 없습니다</Typography>
              {canEdit && (
                <Typography variant="caption" color="text.disabled">아래 버튼으로 추가해보세요</Typography>
              )}
            </Box>
          )}
        </Box>

        {/* 업로드 버튼 */}
        {canEdit && (
          <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Box component="label">
              <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={uploading} />
              <Button
                component="span"
                variant="contained"
                fullWidth
                size="small"
                startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <CloudUploadIcon fontSize="small" />}
                disabled={uploading}
                sx={{ borderRadius: 1.5 }}
              >
                {uploading ? '업로드 중...' : '사진 추가'}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* 사진 확대 보기 */}
      <Dialog open={!!enlarged} onClose={() => setEnlarged(null)} maxWidth="xl"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}>
        <DialogContent sx={{ p: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconButton onClick={() => setEnlarged(null)}
            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', zIndex: 1, '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
            <CloseIcon />
          </IconButton>
          {enlarged && (
            <Box component="img" src={enlarged} alt=""
              sx={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 2, objectFit: 'contain' }} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ── 드래그 가능한 장소 아이템 (컴팩트) ── */
const SortableLocationItem = ({ loc, index, dayId, onDelete, onEdit, deleteLoading, canEdit, selectedLocId, onSelectLoc }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: loc.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const transport = loc.transportMode ? TRANSPORT_ICONS[loc.transportMode] : null;
  const isSelected = selectedLocId === loc.id;
  const imageCount = (loc.images || []).length;

  return (
    <>
      {/* 이동수단 커넥터 */}
      {index > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 4, py: 0.4, bgcolor: 'grey.50' }}>
          <Box sx={{ width: 2, height: 10, bgcolor: transport?.color ?? 'grey.200', borderRadius: 1, ml: 1.5 }} />
          {transport ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              {React.cloneElement(transport.icon, { sx: { fontSize: 11, color: transport.color } })}
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: transport.color, fontWeight: 600, lineHeight: 1 }}>
                {transport.label}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>미지정</Typography>
          )}
        </Box>
      )}

      {/* 장소 아이템 */}
      <Box
        ref={setNodeRef}
        style={style}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 1.5, py: 0.75,
          borderLeft: '3px solid',
          borderColor: isSelected ? 'primary.main' : 'transparent',
          bgcolor: isSelected ? 'primary.50' : 'transparent',
          transition: 'background-color 0.15s, border-color 0.15s',
          '&:hover': { bgcolor: isSelected ? 'primary.50' : 'grey.50' },
        }}
      >
        {canEdit && (
          <Box
            {...attributes} {...listeners}
            sx={{ color: 'grey.300', cursor: 'grab', flexShrink: 0, display: 'flex', '&:active': { cursor: 'grabbing' }, touchAction: 'none' }}
          >
            <DragIndicatorIcon sx={{ fontSize: 15 }} />
          </Box>
        )}

        {/* 번호 */}
        <Box sx={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          bgcolor: isSelected ? 'primary.main' : 'grey.100',
          color: isSelected ? 'white' : 'text.secondary',
          border: '1.5px solid', borderColor: isSelected ? 'primary.main' : 'grey.300',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
        }}>
          {index + 1}
        </Box>

        {/* 텍스트 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="body2"
              fontWeight={isSelected ? 700 : 500}
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', lineHeight: 1.3 }}
            >
              {loc.name}
            </Typography>
            {loc.category && (
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', flexShrink: 0 }}>
                {loc.category}
              </Typography>
            )}
          </Box>
          {loc.memo && (
            <Typography variant="caption" sx={{
              color: 'text.disabled', fontSize: '0.68rem', lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
            }}>
              {loc.memo}
            </Typography>
          )}
        </Box>

        {/* 액션 버튼 */}
        <Box sx={{ display: 'flex', gap: 0.2, flexShrink: 0 }}>
          <Tooltip title={`사진 ${imageCount}장`} arrow>
            <IconButton
              size="small" onClick={() => onSelectLoc(loc.id)}
              color={isSelected ? 'primary' : 'default'}
              sx={{ p: '3px', '&:hover': { bgcolor: 'primary.50' } }}
            >
              <Badge
                badgeContent={imageCount || null} color="primary"
                sx={{ '& .MuiBadge-badge': { fontSize: 8, minWidth: 13, height: 13, p: 0, top: 1, right: 1 } }}
              >
                <PhotoCameraIcon sx={{ fontSize: 15 }} />
              </Badge>
            </IconButton>
          </Tooltip>
          {canEdit && (
            <>
              <Tooltip title="수정" arrow>
                <IconButton size="small" color="primary" onClick={() => onEdit(loc)} sx={{ p: '3px' }}>
                  <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="삭제" arrow>
                <IconButton size="small" color="error" onClick={() => onDelete(dayId, loc.id)}
                  disabled={deleteLoading === loc.id} sx={{ p: '3px' }}>
                  {deleteLoading === loc.id
                    ? <CircularProgress size={13} color="error" />
                    : <DeleteIcon sx={{ fontSize: 15 }} />}
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
    </>
  );
};

const TripDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [selectedLocId, setSelectedLocId] = useState(null); // 갤러리에 표시할 장소
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTags, setEditingTags] = useState([]);
  const [tagSaving, setTagSaving] = useState(false);

  // 멤버 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [memberActionLoading, setMemberActionLoading] = useState(null);

  const fetchTrip = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/trips/${id}`);
      setTrip(response.data.data);
    } catch {
      setError('여행 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  const handleAddLocation = async (dayId, payload) => {
    const response = await axiosInstance.post(`/trips/${id}/days/${dayId}/locations`, payload);
    const newLocation = response.data.data;
    setTrip((prev) => ({
      ...prev,
      tripDays: prev.tripDays.map((day) =>
        day.id === dayId
          ? { ...day, locations: [...day.locations, newLocation].sort((a, b) => a.orderIndex - b.orderIndex) }
          : day
      ),
    }));
  };

  const handleReorder = async (dayId, activeId, overId, locations) => {
    const oldIndex = locations.findIndex((l) => l.id === activeId);
    const newIndex = locations.findIndex((l) => l.id === overId);
    if (oldIndex === newIndex) return;

    const reordered = arrayMove(locations, oldIndex, newIndex);

    // 낙관적 업데이트
    setTrip((prev) => ({
      ...prev,
      tripDays: prev.tripDays.map((day) =>
        day.id === dayId ? { ...day, locations: reordered } : day
      ),
    }));

    try {
      await axiosInstance.patch(`/trips/${id}/days/${dayId}/locations/reorder`, {
        orderedIds: reordered.map((l) => l.id),
      });
    } catch {
      setError('순서 변경에 실패했습니다.');
      // 실패 시 원래 순서 복구
      setTrip((prev) => ({
        ...prev,
        tripDays: prev.tripDays.map((day) =>
          day.id === dayId ? { ...day, locations } : day
        ),
      }));
    }
  };

  const handleUpdateLocation = async (locationId, payload) => {
    const response = await axiosInstance.put(`/locations/${locationId}`, payload);
    const updated = response.data.data;
    setTrip((prev) => ({
      ...prev,
      tripDays: prev.tripDays.map((day) => ({
        ...day,
        locations: day.locations.map((loc) => loc.id === locationId ? updated : loc),
      })),
    }));
  };

  const handleSelectLoc = (locId) => {
    setSelectedLocId((prev) => (prev === locId ? null : locId));
  };

  const handleMapPinClick = (loc) => {
    setSelectedLocId(loc.id);
  };

  const handleImageUploaded = (locId, newImage) => {
    setTrip((prev) => ({
      ...prev,
      tripDays: prev.tripDays.map((day) => ({
        ...day,
        locations: day.locations.map((loc) =>
          loc.id === locId
            ? { ...loc, images: [...(loc.images || []), newImage] }
            : loc
        ),
      })),
    }));
  };

  const handleImageDeleted = (locId, imageId) => {
    setTrip((prev) => ({
      ...prev,
      tripDays: prev.tripDays.map((day) => ({
        ...day,
        locations: day.locations.map((loc) =>
          loc.id === locId
            ? { ...loc, images: (loc.images || []).filter((img) => img.id !== imageId) }
            : loc
        ),
      })),
    }));
  };

  const handleDeleteLocation = async (dayId, locationId) => {
    if (!window.confirm('이 장소를 삭제하시겠습니까?')) return;
    setDeleteLoading(locationId);
    try {
      await axiosInstance.delete(`/locations/${locationId}`);
      setTrip((prev) => ({
        ...prev,
        tripDays: prev.tripDays.map((day) =>
          day.id === dayId
            ? { ...day, locations: day.locations.filter((loc) => loc.id !== locationId) }
            : day
        ),
      }));
    } catch {
      setError('장소 삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await axiosInstance.get(`/users/search?q=${encodeURIComponent(q.trim())}`);
      // 이미 멤버인 사람 제외
      const memberIds = new Set((trip.members || []).map((m) => m.id));
      setSearchResults((res.data.data || []).filter((u) => !memberIds.has(u.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInvite = async (userId) => {
    setInviteLoading(userId);
    setInviteError('');
    try {
      const res = await axiosInstance.post(`/trips/${id}/members`, { userId });
      const newMember = res.data.data;
      setTrip((prev) => ({ ...prev, members: [...(prev.members || []), newMember], memberCount: (prev.memberCount || 0) + 1 }));
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      setSearchQuery('');
    } catch (err) {
      setInviteError(err.response?.data?.message || '초대에 실패했습니다.');
    } finally {
      setInviteLoading(null);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('이 멤버를 내보내시겠습니까?')) return;
    setMemberActionLoading(memberId);
    try {
      await axiosInstance.delete(`/trips/${id}/members/${memberId}`);
      setTrip((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
        memberCount: Math.max(0, (prev.memberCount || 1) - 1),
      }));
    } catch (err) {
      setError(err.response?.data?.message || '멤버 제거에 실패했습니다.');
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleToggleVisibility = async () => {
    const newIsPublic = !trip.isPublic;
    const msg = newIsPublic ? '이 여행을 공개하시겠습니까?' : '이 여행을 비공개로 변경하시겠습니까?';
    if (!window.confirm(msg)) return;
    setVisibilityLoading(true);
    try {
      const res = await axiosInstance.patch(`/trips/${id}/visibility`, { isPublic: newIsPublic });
      setTrip((prev) => ({ ...prev, isPublic: res.data.data.isPublic }));
    } catch (err) {
      setError(err.response?.data?.message || '공개 설정 변경에 실패했습니다.');
    } finally {
      setVisibilityLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('이 여행에서 나가시겠습니까?')) return;
    try {
      await axiosInstance.delete(`/trips/${id}/leave`);
      navigate('/trips', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || '나가기에 실패했습니다.');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/explore/${id}`;
    navigator.clipboard.writeText(url).then(() => setSnackbar('링크가 복사되었습니다.'));
  };

  const openTagDialog = () => {
    setEditingTags([...(trip.tags || [])]);
    setTagDialogOpen(true);
  };

  const toggleEditTag = (tag) => {
    setEditingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveTags = async () => {
    setTagSaving(true);
    try {
      const res = await axiosInstance.patch(`/trips/${id}/tags`, { tags: editingTags });
      setTrip((prev) => ({ ...prev, tags: res.data.data.tags }));
      setTagDialogOpen(false);
      setSnackbar('태그가 저장되었습니다.');
    } catch {
      setSnackbar('태그 저장에 실패했습니다.');
    } finally {
      setTagSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (error && !trip) return <Container maxWidth="lg" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
  if (!trip) return null;

  const isOwner = trip.isOwner !== false;
  const activeDay = trip.tripDays?.[activeTab];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 브레드크럼 */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/trips" underline="hover" color="inherit">내 여행</Link>
        <Typography color="text.primary">{trip.title}</Typography>
      </Breadcrumbs>

      {/* 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ wordBreak: 'keep-all' }}>
              {trip.title}
            </Typography>
            {!isOwner && (
              <Chip icon={<PeopleIcon />} label={`${trip.ownerNickname}의 여행`} color="secondary" size="small" />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary">
            {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)} &nbsp;&bull;&nbsp; 총 {trip.tripDays?.length}일
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {trip.isPublic && (
            <Tooltip title="공유 링크 복사">
              <Button variant="outlined" size="small" startIcon={<ShareIcon />} onClick={handleShare}>
                공유
              </Button>
            </Tooltip>
          )}
          {isOwner && (
            <Button variant="outlined" size="small" startIcon={<LocalOfferIcon />} onClick={openTagDialog}>
              태그
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<PeopleIcon />}
            onClick={() => setMemberDialogOpen(true)}
          >
            멤버 관리
            {(trip.memberCount > 0) && (
              <Chip label={trip.memberCount + 1} size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.7rem' }} />
            )}
          </Button>
          {isOwner && (
            <Button
              variant="outlined"
              size="small"
              startIcon={visibilityLoading ? <CircularProgress size={14} /> : (trip.isPublic ? <PublicIcon /> : <LockIcon />)}
              onClick={handleToggleVisibility}
              disabled={visibilityLoading}
              color={trip.isPublic ? 'success' : 'inherit'}
            >
              {trip.isPublic ? '공개' : '비공개'}
            </Button>
          )}
          {!isOwner && (
            <Button variant="outlined" color="warning" startIcon={<ExitToAppIcon />} onClick={handleLeave} size="small">
              여행 나가기
            </Button>
          )}
        </Box>
      </Box>

      {/* 태그 표시 */}
      {trip.tags && trip.tags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
          {[...trip.tags].map((tag) => (
            <Chip key={tag} label={tag} size="small" color="primary" variant="outlined" />
          ))}
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* 일자 탭 */}
      {trip.tripDays && trip.tripDays.length > 0 ? (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setSelectedLocId(null); }} variant="scrollable" scrollButtons="auto">
              {trip.tripDays.map((day, index) => (
                <Tab
                  key={day.id}
                  label={
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" display="block" fontWeight="bold">{index + 1}일차</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDateShort(day.date)}</Typography>
                    </Box>
                  }
                  sx={{ minWidth: 80 }}
                />
              ))}
            </Tabs>
          </Box>

          {activeDay && (
            <>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                {/* 좌측: 장소 목록 + 추가 폼 */}
                <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 300px' }, minWidth: 0, width: '100%' }}>
                  {/* 장소 목록 카드 */}
                  <Paper
                    elevation={0}
                    sx={{ borderRadius: 2, mb: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
                  >
                    <Box sx={{
                      px: 2, py: 1.25,
                      display: 'flex', alignItems: 'center', gap: 1,
                      background: 'linear-gradient(90deg, #f0f4ff 0%, #e8eeff 100%)',
                      borderBottom: '1px solid', borderColor: 'divider',
                    }}>
                      <LocationOnIcon color="primary" sx={{ fontSize: 17 }} />
                      <Typography variant="subtitle2" fontWeight="bold" color="primary.dark">
                        장소 목록
                      </Typography>
                      <Chip
                        label={activeDay.locations?.length || 0}
                        size="small"
                        color="primary"
                        sx={{ ml: 'auto', height: 18, fontSize: '0.68rem', '& .MuiChip-label': { px: 1 } }}
                      />
                    </Box>

                    {activeDay.locations && activeDay.locations.length > 0 ? (
                      <Box sx={{
                        maxHeight: 440,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 2, '&:hover': { bgcolor: 'grey.400' } },
                      }}>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={({ active, over }) => {
                            if (over && active.id !== over.id) {
                              handleReorder(activeDay.id, active.id, over.id, activeDay.locations);
                            }
                          }}
                        >
                          <SortableContext
                            items={activeDay.locations.map((l) => l.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <List dense disablePadding>
                              {activeDay.locations.map((loc, index) => (
                                <SortableLocationItem
                                  key={loc.id}
                                  loc={loc}
                                  index={index}
                                  dayId={activeDay.id}
                                  onDelete={handleDeleteLocation}
                                  onEdit={setEditingLoc}
                                  deleteLoading={deleteLoading}
                                  canEdit={isOwner || true}
                                  selectedLocId={selectedLocId}
                                  onSelectLoc={handleSelectLoc}
                                />
                              ))}
                            </List>
                          </SortableContext>
                        </DndContext>
                      </Box>
                    ) : (
                      <Box sx={{ py: 5, textAlign: 'center' }}>
                        <LocationOnIcon sx={{ fontSize: 36, color: 'grey.200', mb: 1 }} />
                        <Typography variant="body2" color="text.disabled">
                          이 날짜에 등록된 장소가 없습니다
                        </Typography>
                      </Box>
                    )}
                  </Paper>

                  <AddLocationForm
                    tripId={id}
                    dayId={activeDay.id}
                    onLocationAdded={(payload) => handleAddLocation(activeDay.id, payload)}
                    existingCount={activeDay.locations?.length || 0}
                    country={trip?.country || ''}
                  />
                </Box>

                {/* 우측: 지도 */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Paper
                    elevation={0}
                    sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
                  >
                    <Box sx={{
                      px: 2, py: 1.25,
                      display: 'flex', alignItems: 'center', gap: 1,
                      background: 'linear-gradient(90deg, #f0f4ff 0%, #e8eeff 100%)',
                      borderBottom: '1px solid', borderColor: 'divider',
                    }}>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary.dark">경로 지도</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                        핀을 눌러 사진 보기
                      </Typography>
                    </Box>
                    <TripMap
                      key={activeDay.id}
                      locations={activeDay.locations || []}
                      onLocationSelect={handleMapPinClick}
                    />
                  </Paper>
                </Box>
              </Box>

              {/* 갤러리 Drawer (레이아웃 외부에 렌더됨) */}
              <LocationGalleryPanel
                locations={activeDay.locations || []}
                selectedLocId={selectedLocId}
                canEdit={isOwner || true}
                onImageUploaded={handleImageUploaded}
                onImageDeleted={handleImageDeleted}
                onClose={() => setSelectedLocId(null)}
              />
            </>
          )}
        </>
      ) : (
        <Alert severity="info">이 여행에 등록된 날짜가 없습니다.</Alert>
      )}

      {/* 멤버 관리 다이얼로그 */}
      <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon fontSize="small" />
          여행 멤버
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <MemberPanel
            trip={trip}
            isOwner={isOwner}
            currentUser={currentUser}
            searchQuery={searchQuery}
            searchResults={searchResults}
            searchLoading={searchLoading}
            inviteLoading={inviteLoading}
            inviteError={inviteError}
            memberActionLoading={memberActionLoading}
            onSearch={handleSearch}
            onInvite={handleInvite}
            onRemoveMember={handleRemoveMember}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 장소 수정 다이얼로그 */}
      <EditLocationDialog
        open={!!editingLoc}
        loc={editingLoc}
        isFirst={
          editingLoc
            ? trip?.tripDays
                ?.find((d) => d.locations.some((l) => l.id === editingLoc.id))
                ?.locations
                ?.findIndex((l) => l.id === editingLoc.id) === 0
            : false
        }
        onClose={() => setEditingLoc(null)}
        onSave={handleUpdateLocation}
      />

      {/* 태그 수정 다이얼로그 */}
      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalOfferIcon fontSize="small" /> 태그 수정
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            여행의 성격에 맞는 태그를 선택하세요
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {TRIP_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                clickable
                onClick={() => toggleEditTag(tag)}
                color={editingTags.includes(tag) ? 'primary' : 'default'}
                variant={editingTags.includes(tag) ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTagDialogOpen(false)} disabled={tagSaving}>취소</Button>
          <Button variant="contained" onClick={handleSaveTags} disabled={tagSaving}>
            {tagSaving ? <CircularProgress size={20} color="inherit" /> : '저장'}
          </Button>
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

/* ── 멤버 패널 컴포넌트 ──────────────────────────────── */
const MemberPanel = ({
  trip, isOwner, currentUser,
  searchQuery, searchResults, searchLoading, inviteLoading, inviteError, memberActionLoading,
  onSearch, onInvite, onRemoveMember,
}) => {
  const members = trip.members || [];

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PeopleIcon color="action" fontSize="small" />
        <Typography variant="subtitle1" fontWeight="bold">여행 멤버</Typography>
        <Chip label={members.length + 1} size="small" sx={{ ml: 'auto' }} />
      </Box>
      <Divider />

      <List dense disablePadding>
        {/* 소유자 */}
        <ListItem sx={{ px: 2 }}>
          <ListItemAvatar sx={{ minWidth: 40 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {trip.ownerNickname?.[0]?.toUpperCase()}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={trip.ownerNickname}
            secondary={isOwner ? '나 (소유자)' : '소유자'}
            primaryTypographyProps={{ fontWeight: 'medium', fontSize: '0.9rem' }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
          <Chip icon={<StarIcon />} label="소유자" size="small" color="primary" variant="outlined" />
        </ListItem>

        {/* 초대된 멤버들 */}
        {members.map((member) => {
          const isMe = currentUser?.email === member.email;
          return (
            <React.Fragment key={member.id}>
              <Divider />
              <ListItem sx={{ px: 2 }}>
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                    {member.nickname[0].toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.nickname}
                  secondary={isMe ? '나' : '멤버'}
                  primaryTypographyProps={{ fontWeight: 'medium', fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
                {isOwner && (
                  <Tooltip title="멤버 내보내기">
                    <span>
                      <IconButton
                        size="small" color="error"
                        onClick={() => onRemoveMember(member.id)}
                        disabled={memberActionLoading === member.id}
                      >
                        {memberActionLoading === member.id
                          ? <CircularProgress size={16} />
                          : <DeleteIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>

      {/* 닉네임 검색 초대 (소유자만) */}
      {isOwner && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              <PersonAddIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              닉네임으로 멤버 검색
            </Typography>
            {inviteError && (
              <Alert severity="error" sx={{ mb: 1, py: 0 }}>{inviteError}</Alert>
            )}
            <TextField
              size="small"
              fullWidth
              placeholder="닉네임 입력..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              InputProps={{
                endAdornment: searchLoading && <CircularProgress size={16} />,
              }}
            />
            {searchResults.length > 0 && (
              <Paper variant="outlined" sx={{ mt: 1, maxHeight: 180, overflow: 'auto' }}>
                <List dense disablePadding>
                  {searchResults.map((user, idx) => (
                    <React.Fragment key={user.id}>
                      {idx > 0 && <Divider />}
                      <ListItem sx={{ px: 1.5 }}>
                        <ListItemAvatar sx={{ minWidth: 36 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                            {user.nickname[0].toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.nickname}
                          primaryTypographyProps={{ fontSize: '0.875rem' }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => onInvite(user.id)}
                          disabled={inviteLoading === user.id}
                          sx={{ flexShrink: 0, minWidth: 52 }}
                        >
                          {inviteLoading === user.id ? <CircularProgress size={14} color="inherit" /> : '초대'}
                        </Button>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
            {searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                검색 결과가 없습니다
              </Typography>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default TripDetailPage;
