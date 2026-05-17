import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../api/adminApi";
import type { User } from "../../types";
import type { PaginatedUsers } from "../../api/adminApi";
import ConfirmModal from "../../components/ui/ConfirmModal";
import CreateUserModal from "../../components/ui/CreateUserModal";
import EditUserModal from "../../components/ui/EditUserModal";
import ImportUsersCsvModal from "../../components/ui/ImportUsersCsvModal";
import UserAvatar from "../../components/ui/UserAvatar";

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ user: User; action: 'suspend' | 'activate' } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getUsers({
        search: search || undefined,
        department: deptFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleStatus = async () => {
    if (!confirmAction) return;
    try {
      const newStatus = confirmAction.action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';
      await adminApi.updateUserStatus(confirmAction.user.id, newStatus);
      showToast(`User ${confirmAction.user.fullName} has been ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}.`);
      fetchUsers();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    } finally {
      setConfirmAction(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      await adminApi.exportUsersCsv();
      showToast("CSV exported successfully.");
    } catch {
      showToast("Failed to export CSV.");
    }
  };

  const users = data?.users || [];
  const pagination = data?.pagination;
  const activeCount = users.filter(u => u.status === 'ACTIVE').length;

  // Get unique departments for filter
  const departments = [...new Set(users.map(u => u.department).filter(Boolean))] as string[];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-8 z-[200] bg-wp-surface-container-high text-wp-on-surface px-6 py-3 rounded-xl shadow-2xl border border-wp-outline-variant/10 text-sm font-medium animate-fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tight text-wp-on-surface">User Management</h2>
          <p className="text-wp-on-surface-variant max-w-lg">Manage employee access, roles, and security protocols across the enterprise network.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wp-surface-container-high text-wp-on-surface font-semibold text-sm hover:bg-wp-surface-bright transition-all active:scale-95">
            <span className="material-symbols-outlined text-lg">upload_file</span>
            Import CSV
          </button>
          <button onClick={handleExportCsv} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wp-surface-container-high text-wp-on-surface font-semibold text-sm hover:bg-wp-surface-bright transition-all active:scale-95">
            <span className="material-symbols-outlined text-lg">download</span>
            Export CSV
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-wp-primary to-wp-primary-container text-wp-on-primary font-bold text-sm shadow-xl shadow-wp-primary/20 transition-all active:scale-95">
            <span className="material-symbols-outlined text-lg">person_add</span>
            Add Member
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-wp-surface-container-low p-6 rounded-2xl flex flex-col justify-between h-32 border-l-4 border-wp-primary">
          <span className="text-xs font-bold uppercase tracking-widest text-wp-primary">Total Users</span>
          <span className="text-3xl font-black text-wp-on-surface">{pagination?.total || 0}</span>
        </div>
        <div className="bg-wp-surface-container-low p-6 rounded-2xl flex flex-col justify-between h-32">
          <span className="text-xs font-bold uppercase tracking-widest text-wp-on-surface-variant">Active</span>
          <span className="text-3xl font-black text-emerald-500">{activeCount}</span>
        </div>
        <div className="bg-wp-surface-container-low p-6 rounded-2xl flex flex-col justify-between h-32">
          <span className="text-xs font-bold uppercase tracking-widest text-wp-on-surface-variant">Suspended</span>
          <span className="text-3xl font-black text-red-400">{users.length - activeCount}</span>
        </div>
        <div onClick={() => setShowCreateModal(true)} className="bg-wp-surface-lowest border border-wp-outline-variant/10 p-6 rounded-2xl flex flex-col justify-center items-center h-32 group hover:bg-wp-surface-container-high transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-wp-primary mb-2">person_add</span>
          <span className="text-xs font-bold text-wp-on-surface">Add New User</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-wp-outline">search</span>
          <input
            type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search employees by name or email..."
            className="w-full bg-wp-surface-lowest border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-wp-primary/20 transition-all placeholder:text-wp-outline text-wp-on-surface"
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
            className="bg-wp-surface-lowest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-wp-primary/20 text-wp-on-surface-variant font-medium min-w-[140px]"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-wp-surface-lowest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-wp-primary/20 text-wp-on-surface-variant font-medium min-w-[120px]"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-wp-surface-container-low rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-10 h-10 border-4 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin"></div>
            </div>
          ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-wp-surface-container-high/50">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-wp-on-surface-variant">Employee</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-wp-on-surface-variant">Department</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-wp-on-surface-variant">Role</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-wp-on-surface-variant">Status</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-wp-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wp-outline-variant/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-wp-surface-bright/20 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        src={user.avatarUrl}
                        name={user.fullName}
                        className={`h-10 w-10 ${user.status === 'SUSPENDED' ? 'grayscale opacity-60' : ''}`}
                      />
                      <div>
                        <div className={`font-bold ${user.status === 'SUSPENDED' ? 'text-wp-on-surface-variant' : 'text-wp-on-surface'}`}>{user.fullName}</div>
                        <div className={`text-xs ${user.status === 'SUSPENDED' ? 'text-wp-outline' : 'text-wp-on-surface-variant'}`}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-sm font-medium ${user.status === 'SUSPENDED' ? 'text-wp-on-surface-variant' : 'text-wp-on-surface'}`}>
                      {user.department || "No Dept"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${user.role === 'ADMIN' ? 'bg-wp-primary/10 text-wp-primary border border-wp-primary/20' : 'bg-wp-surface-container-highest text-wp-on-surface border border-wp-outline-variant/30'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'SUSPENDED' ? 'bg-wp-error shadow-[0_0_8px_rgba(255,180,171,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}></div>
                      <span className={`text-sm ${user.status === 'SUSPENDED' ? 'text-wp-error' : 'text-wp-on-surface'}`}>
                        {user.status === 'SUSPENDED' ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditUser(user)} className="p-2 text-wp-outline hover:text-wp-primary hover:bg-wp-primary/5 rounded-lg transition-all" title="Edit User">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      {user.status === 'SUSPENDED' ? (
                        <button onClick={() => setConfirmAction({ user, action: 'activate' })} className="p-2 text-wp-primary hover:bg-wp-primary/10 rounded-lg transition-all" title="Activate Account">
                          <span className="material-symbols-outlined text-lg">person</span>
                        </button>
                      ) : (
                        <button onClick={() => setConfirmAction({ user, action: 'suspend' })} className="p-2 text-wp-outline hover:text-wp-error hover:bg-wp-error/5 rounded-lg transition-all" title="Suspend Account">
                          <span className="material-symbols-outlined text-lg">person_off</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-wp-on-surface-variant">No users found.</td></tr>
              )}
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-8 py-4 bg-wp-surface-container-highest/30 flex items-center justify-between">
            <span className="text-xs font-medium text-wp-on-surface-variant">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-2 text-wp-outline hover:text-wp-on-surface disabled:opacity-30 transition-all"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-wp-outline">…</span>}
                    <button onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === page ? 'bg-wp-primary text-wp-on-primary' : 'text-wp-on-surface-variant hover:bg-wp-surface-container-high'}`}
                    >{p}</button>
                  </span>
                ))}
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                className="p-2 text-wp-outline hover:text-wp-on-surface disabled:opacity-30 transition-all"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(result) => {
          showToast(`User created! Default password: ${result.defaultPassword}`);
          fetchUsers();
        }}
        onSubmit={adminApi.createUser}
      />

      <EditUserModal
        open={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={() => {
          showToast("User updated successfully.");
          fetchUsers();
        }}
        onSubmit={adminApi.updateUser}
      />

      <ImportUsersCsvModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={() => {
          showToast("Import completed. Result CSV downloaded.");
          fetchUsers();
        }}
        onSubmit={adminApi.importUsersCsv}
      />

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.action === 'suspend' ? 'Suspend User' : 'Activate User'}
        message={confirmAction?.action === 'suspend'
          ? `Are you sure you want to suspend "${confirmAction?.user.fullName}"? They will lose access to the platform.`
          : `Are you sure you want to reactivate "${confirmAction?.user.fullName}"?`
        }
        confirmText={confirmAction?.action === 'suspend' ? 'Suspend' : 'Activate'}
        variant={confirmAction?.action === 'suspend' ? 'danger' : 'primary'}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmAction(null)}
      />

      {/* FAB */}
      <div className="fixed bottom-10 right-10 z-50">
        <button onClick={() => setShowCreateModal(true)} className="h-16 w-16 bg-wp-primary text-wp-on-primary rounded-full shadow-[0_20px_40px_rgba(0,82,255,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group">
          <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-500" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        </button>
      </div>
    </div>
  );
}
