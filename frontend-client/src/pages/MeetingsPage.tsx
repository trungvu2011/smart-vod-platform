import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Video, Clock, ArrowRight, X, Radio, UserCheck, Building2 } from 'lucide-react';
import { meetingApi } from '../api/meetingApi';
import { userApi } from '../api/userApi';
import type { DepartmentOption, MeetingRoom } from '../types';
import UserAvatar from '../components/ui/UserAvatar';

export default function MeetingsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createMax, setCreateMax] = useState(50);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await meetingApi.listRooms(filter || undefined);
      setRooms(data.rooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (!showCreateModal) return;

    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const data = await userApi.getDepartments();
        setDepartments(data);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [showCreateModal]);

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateName('');
    setCreateMax(50);
    setSelectedDepartments([]);
  };

  const toggleDepartment = (department: string) => {
    setSelectedDepartments((current) =>
      current.includes(department)
        ? current.filter((item) => item !== department)
        : [...current, department]
    );
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      setCreating(true);
      const res = await meetingApi.createRoom({
        displayName: createName.trim(),
        maxParticipants: createMax,
        invitedDepartments: selectedDepartments,
      });
      closeCreateModal();
      // Navigate to the newly created room
      navigate(`/meetings/${res.room.name}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Không thể tạo phòng họp. Vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (roomName: string) => {
    try {
      setJoining(roomName);
      navigate(`/meetings/${roomName}`);
    } catch (err) {
      console.error('Failed to join room:', err);
    } finally {
      setJoining(null);
    }
  };

  const statusBadge = (status: MeetingRoom['status']) => {
    const config = {
      WAITING: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Waiting' },
      ACTIVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse', label: 'Live' },
      ENDED: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-400', label: 'Ended' },
    };
    const c = config[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-wp-on-surface flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-wp-gradient">
              <Users size={22} className="text-wp-on-primary" />
            </div>
            Online Meetings
          </h1>
          <p className="text-wp-on-surface-variant mt-1 text-sm">
            Tạo hoặc tham gia phòng họp trực tuyến. Bản ghi sẽ tự động được lưu thành VOD.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wp-gradient text-wp-on-primary
            font-semibold text-sm shadow-lg hover:shadow-wp-glow active:scale-95 transition-all"
        >
          <Plus size={18} />
          Tạo phòng
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { value: '', label: 'Tất cả' },
          { value: 'ACTIVE', label: 'Đang họp' },
          { value: 'WAITING', label: 'Chờ' },
          { value: 'ENDED', label: 'Đã kết thúc' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${filter === f.value
                ? 'bg-wp-primary text-wp-on-primary'
                : 'bg-wp-surface-container text-wp-on-surface-variant hover:bg-wp-surface-container-high'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-wp-on-surface-variant">
          <Video size={48} className="mb-4 opacity-40" />
          <p className="text-lg font-medium">Chưa có phòng họp nào</p>
          <p className="text-sm mt-1">Tạo phòng mới để bắt đầu cuộc họp trực tuyến.</p>
          <button
            onClick={openCreateModal}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wp-gradient text-wp-on-primary
              font-semibold text-sm shadow-lg hover:shadow-wp-glow active:scale-95 transition-all"
          >
            <Plus size={18} />
            Tạo phòng mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-wp-surface-container rounded-2xl border border-wp-outline/10
                hover:border-wp-primary/30 transition-all duration-300 overflow-hidden group"
            >
              {/* Card Header — Gradient accent for active rooms */}
              <div className={`h-1.5 ${room.status === 'ACTIVE' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : room.status === 'WAITING' ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-wp-outline/20'}`} />

              <div className="p-5">
                {/* Status + Title */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-wp-on-surface line-clamp-1 flex-1 mr-2">
                    {room.displayName}
                  </h3>
                  {statusBadge(room.status)}
                </div>

                {/* Host info */}
                <div className="flex items-center gap-2 mb-4 text-sm text-wp-on-surface-variant">
                  <UserAvatar
                    src={room.host?.avatarUrl}
                    name={room.host?.fullName}
                    className="w-6 h-6"
                    initialClassName="text-[10px]"
                  />
                  <span>{room.host?.fullName || 'Unknown'}</span>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-wp-on-surface-variant mb-4">
                  <span className="flex items-center gap-1">
                    <UserCheck size={14} />
                    {room._count?.participants || 0} người
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatDate(room.createdAt)}
                  </span>
                  {room._count?.recordings ? (
                    <span className="flex items-center gap-1">
                      <Radio size={14} />
                      {room._count.recordings} bản ghi
                    </span>
                  ) : null}
                </div>

                {/* Action */}
                {room.status !== 'ENDED' ? (
                  <button
                    onClick={() => handleJoin(room.name)}
                    disabled={joining === room.name}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                      bg-wp-surface-container-high text-wp-primary font-semibold text-sm
                      hover:bg-wp-primary hover:text-wp-on-primary
                      active:scale-[0.98] transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joining === room.name ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ArrowRight size={16} />
                        {room.status === 'ACTIVE' ? 'Tham gia ngay' : 'Vào phòng chờ'}
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-center text-xs text-wp-on-surface-variant py-2.5 opacity-60">
                    Phòng đã kết thúc
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-wp-surface-container rounded-2xl w-full max-w-lg mx-4 shadow-2xl border border-wp-outline/10 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-wp-outline/10">
              <h2 className="text-lg font-bold text-wp-on-surface flex items-center gap-2">
                <Users size={20} className="text-wp-primary" />
                Tạo phòng họp mới
              </h2>
              <button
                onClick={closeCreateModal}
                className="p-1.5 rounded-lg hover:bg-wp-surface-container-high text-wp-on-surface-variant transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-wp-on-surface mb-1.5">
                  Tên phòng họp *
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="VD: Họp team Frontend Sprint 12"
                  className="w-full px-4 py-2.5 rounded-xl bg-wp-surface text-wp-on-surface
                    border border-wp-outline/20 focus:border-wp-primary focus:ring-1 focus:ring-wp-primary
                    outline-none text-sm transition-all placeholder:text-wp-on-surface-variant/50"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wp-on-surface mb-1.5">
                  Số người tối đa
                </label>
                <input
                  type="number"
                  value={createMax}
                  onChange={(e) => setCreateMax(Number(e.target.value) || 50)}
                  min={2}
                  max={100}
                  className="w-full px-4 py-2.5 rounded-xl bg-wp-surface text-wp-on-surface
                    border border-wp-outline/20 focus:border-wp-primary focus:ring-1 focus:ring-wp-primary
                    outline-none text-sm transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-wp-on-surface">
                    Mời phòng ban
                  </label>
                  {selectedDepartments.length > 0 && (
                    <span className="text-xs font-medium text-wp-primary">
                      {selectedDepartments.length} đã chọn
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-wp-outline/20 bg-wp-surface overflow-hidden">
                  {loadingDepartments ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-wp-on-surface-variant">
                      <div className="w-4 h-4 border-2 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin" />
                      Đang tải phòng ban...
                    </div>
                  ) : departments.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-wp-on-surface-variant">
                      Chưa có phòng ban nào để mời.
                    </div>
                  ) : (
                    <div className="max-h-44 overflow-y-auto divide-y divide-wp-outline/10">
                      {departments.map((department) => {
                        const checked = selectedDepartments.includes(department.name);
                        return (
                          <label
                            key={department.name}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-wp-surface-container-high transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDepartment(department.name)}
                              className="w-4 h-4 accent-wp-primary"
                            />
                            <Building2 size={16} className="text-wp-on-surface-variant shrink-0" />
                            <span className="flex-1 min-w-0 text-sm font-medium text-wp-on-surface truncate">
                              {department.name}
                            </span>
                            <span className="text-xs text-wp-on-surface-variant shrink-0">
                              {department.userCount} người
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-wp-outline/10">
              <button
                onClick={closeCreateModal}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-wp-on-surface-variant
                  hover:bg-wp-surface-container-high transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={!createName.trim() || creating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wp-gradient text-wp-on-primary
                  font-semibold text-sm shadow-lg hover:shadow-wp-glow active:scale-95 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Tạo phòng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
