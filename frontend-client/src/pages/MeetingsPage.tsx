import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Video, Clock, ArrowRight, X, Radio, UserCheck, Building2, ChevronDown } from 'lucide-react';
import { meetingApi } from '../api/meetingApi';
import { userApi } from '../api/userApi';
import type { DepartmentWithMembers, MeetingRoom } from '../types';
import UserAvatar from '../components/ui/UserAvatar';

export default function MeetingsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createMax, setCreateMax] = useState(50);
  const [departments, setDepartments] = useState<DepartmentWithMembers[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [inviteAllDepartments, setInviteAllDepartments] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
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
        const data = await userApi.getDepartmentMembers();
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

  const openCreateModal = () => setShowCreateModal(true);

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateName('');
    setCreateMax(50);
    setSelectedDepartments([]);
    setSelectedUserIds([]);
    setInviteAllDepartments(false);
    setExpandedDepartments([]);
  };

  const toggleDepartment = (department: string) => {
    setSelectedDepartments((current) =>
      current.includes(department)
        ? current.filter((item) => item !== department)
        : [...current, department],
    );
  };

  const toggleExpandDepartment = (department: string) => {
    setExpandedDepartments((current) =>
      current.includes(department)
        ? current.filter((item) => item !== department)
        : [...current, department],
    );
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((item) => item !== userId)
        : [...current, userId],
    );
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      setCreating(true);
      const invitedDepartments = inviteAllDepartments
        ? departments.map((d) => d.name)
        : selectedDepartments;

      const res = await meetingApi.createRoom({
        displayName: createName.trim(),
        maxParticipants: createMax,
        invitedDepartments,
        invitedUserIds: selectedUserIds,
      });

      closeCreateModal();
      navigate(`/meetings/${res.room.name}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Unable to create meeting room. Please try again later.');
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
    return new Date(dateStr).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-wp-on-surface flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-wp-gradient">
              <Users size={22} className="text-wp-on-primary" />
            </div>
            Online Meetings
          </h1>
          <p className="text-wp-on-surface-variant mt-1 text-sm">
            Create or join online meeting rooms. Recordings are automatically saved as VOD.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wp-gradient text-wp-on-primary font-semibold text-sm shadow-lg hover:shadow-wp-glow active:scale-95 transition-all"
        >
          <Plus size={18} />
          Create Room
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { value: '', label: 'All' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'WAITING', label: 'Waiting' },
          { value: 'ENDED', label: 'Ended' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.value ? 'bg-wp-primary text-wp-on-primary' : 'bg-wp-surface-container text-wp-on-surface-variant hover:bg-wp-surface-container-high'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-wp-on-surface-variant">
          <Video size={48} className="mb-4 opacity-40" />
          <p className="text-lg font-medium">No meeting rooms yet</p>
          <p className="text-sm mt-1">Create a new room to start your online meeting.</p>
          <button
            onClick={openCreateModal}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wp-gradient text-wp-on-primary font-semibold text-sm shadow-lg hover:shadow-wp-glow active:scale-95 transition-all"
          >
            <Plus size={18} />
            Create New Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-wp-surface-container rounded-2xl border border-wp-outline/10 hover:border-wp-primary/30 transition-all duration-300 overflow-hidden group"
            >
              <div className={`h-1.5 ${room.status === 'ACTIVE' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : room.status === 'WAITING' ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-wp-outline/20'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-wp-on-surface line-clamp-1 flex-1 mr-2">{room.displayName}</h3>
                  {statusBadge(room.status)}
                </div>

                <div className="flex items-center gap-2 mb-4 text-sm text-wp-on-surface-variant">
                  <UserAvatar src={room.host?.avatarUrl} name={room.host?.fullName} className="w-6 h-6" initialClassName="text-[10px]" />
                  <span>{room.host?.fullName || 'Unknown'}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-wp-on-surface-variant mb-4">
                  <span className="flex items-center gap-1"><UserCheck size={14} />{room._count?.participants || 0} people</span>
                  <span className="flex items-center gap-1"><Clock size={14} />{formatDate(room.createdAt)}</span>
                  {room._count?.recordings ? (<span className="flex items-center gap-1"><Radio size={14} />{room._count.recordings} recordings</span>) : null}
                </div>

                {room.status !== 'ENDED' ? (
                  <button
                    onClick={() => handleJoin(room.name)}
                    disabled={joining === room.name}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-wp-surface-container-high text-wp-primary font-semibold text-sm hover:bg-wp-primary hover:text-wp-on-primary active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joining === room.name ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ArrowRight size={16} />
                        {room.status === 'ACTIVE' ? 'Join Now' : 'Enter Waiting Room'}
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-center text-xs text-wp-on-surface-variant py-2.5 opacity-60">This room has ended</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-wp-surface-container rounded-2xl w-full max-w-lg mx-4 shadow-2xl border border-wp-outline/10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-wp-outline/10">
              <h2 className="text-lg font-bold text-wp-on-surface flex items-center gap-2">
                <Users size={20} className="text-wp-primary" />
                Create New Meeting Room
              </h2>
              <button onClick={closeCreateModal} className="p-1.5 rounded-lg hover:bg-wp-surface-container-high text-wp-on-surface-variant transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-wp-on-surface mb-1.5">Room Name *</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Example: Frontend Team Sprint 12"
                  className="w-full px-4 py-2.5 rounded-xl bg-wp-surface text-wp-on-surface border border-wp-outline/20 focus:border-wp-primary focus:ring-1 focus:ring-wp-primary outline-none text-sm transition-all placeholder:text-wp-on-surface-variant/50"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wp-on-surface mb-1.5">Maximum Participants</label>
                <input
                  type="number"
                  value={createMax}
                  onChange={(e) => setCreateMax(Number(e.target.value) || 50)}
                  min={2}
                  max={100}
                  className="w-full px-4 py-2.5 rounded-xl bg-wp-surface text-wp-on-surface border border-wp-outline/20 focus:border-wp-primary focus:ring-1 focus:ring-wp-primary outline-none text-sm transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-wp-on-surface">Invite Departments / Members</label>
                  {(selectedDepartments.length > 0 || selectedUserIds.length > 0 || inviteAllDepartments) && (
                    <span className="text-xs font-medium text-wp-primary">
                      {inviteAllDepartments ? 'All Departments' : `${selectedDepartments.length} departments, ${selectedUserIds.length} people`}
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-wp-outline/20 bg-wp-surface overflow-hidden">
                  {loadingDepartments ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-wp-on-surface-variant">
                      <div className="w-4 h-4 border-2 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin" />
                      Loading departments...
                    </div>
                  ) : departments.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-wp-on-surface-variant">No departments available to invite.</div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-wp-surface-container-high transition-colors border-b border-wp-outline/10">
                        <input
                          type="checkbox"
                          checked={inviteAllDepartments}
                          onChange={() => {
                            setInviteAllDepartments((prev) => !prev);
                            if (!inviteAllDepartments) {
                              setSelectedDepartments([]);
                              setSelectedUserIds([]);
                            }
                          }}
                          className="w-4 h-4 accent-wp-primary"
                        />
                        <Building2 size={16} className="text-wp-on-surface-variant shrink-0" />
                        <span className="flex-1 min-w-0 text-sm font-semibold text-wp-on-surface">All Departments</span>
                        <span className="text-xs text-wp-on-surface-variant shrink-0">
                          {departments.reduce((sum, dept) => sum + dept.userCount, 0)} people
                        </span>
                      </label>

                      {departments.map((department) => {
                        const checked = selectedDepartments.includes(department.name);
                        const expanded = expandedDepartments.includes(department.name);
                        return (
                          <div key={department.name} className="border-b border-wp-outline/10 last:border-b-0">
                            <div className="flex items-center gap-3 px-4 py-3 hover:bg-wp-surface-container-high transition-colors">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={inviteAllDepartments}
                                onChange={() => toggleDepartment(department.name)}
                                className="w-4 h-4 accent-wp-primary disabled:opacity-50"
                              />
                              <button type="button" onClick={() => toggleExpandDepartment(department.name)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                                <Building2 size={16} className="text-wp-on-surface-variant shrink-0" />
                                <span className="text-sm font-medium text-wp-on-surface truncate">{department.name}</span>
                                <ChevronDown size={14} className={`text-wp-on-surface-variant transition-transform ${expanded ? 'rotate-180' : ''}`} />
                              </button>
                              <span className="text-xs text-wp-on-surface-variant shrink-0">{department.userCount} people</span>
                            </div>

                            {expanded && (
                              <div className="px-4 pb-3">
                                <div className="rounded-lg border border-wp-outline/10 overflow-hidden divide-y divide-wp-outline/10">
                                  {department.users.map((user) => (
                                    <label key={user.id} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-wp-surface-container-high/60 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={selectedUserIds.includes(user.id)}
                                        disabled={inviteAllDepartments}
                                        onChange={() => toggleUser(user.id)}
                                        className="w-4 h-4 accent-wp-primary disabled:opacity-50"
                                      />
                                      <UserAvatar src={user.avatarUrl} name={user.fullName} className="w-6 h-6" initialClassName="text-[10px]" />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm text-wp-on-surface truncate">{user.fullName}</div>
                                        {user.title ? (<div className="text-[11px] text-wp-on-surface-variant truncate">{user.title}</div>) : null}
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-wp-outline/10">
              <button onClick={closeCreateModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-wp-on-surface-variant hover:bg-wp-surface-container-high transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!createName.trim() || creating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wp-gradient text-wp-on-primary font-semibold text-sm shadow-lg hover:shadow-wp-glow active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
