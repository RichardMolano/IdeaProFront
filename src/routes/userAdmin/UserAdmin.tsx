// src/routes/userAdmin/UserAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import { AdminAPI } from "../../api/client";
import { Button, Select, Input } from "../../ui/Form";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string; // <- string plano
  roleId?: string | null; // opcional
  dependence?: { id: string; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function UserAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyRow, setBusyRow] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState("");

  // creación
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState<string>("");

  // buffers edición
  const [editBuffer, setEditBuffer] = useState<
    Record<string, { email: string; role: string; password?: string }>
  >({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await AdminAPI.users();
        if (!mounted) return;
        setUsers(data || []);
        // set rol por defecto si hay alguno
        if (!newRole && data?.length) setNewRole(data[0].role || "");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // roles dinámicos desde lo que llega del backend
  const roleOptions = useMemo(() => {
    const set = new Set<string>();

    if (set.size === 0)
      ["Admin", "Client", "Solver"].forEach((r) => set.add(r));
    return Array.from(set);
  }, [users]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.dependence?.name?.toLowerCase().includes(q)
    );
  }, [users, filter]);

  async function refresh() {
    const data = await AdminAPI.users();
    setUsers(data || []);
  }

  async function createUser() {
    if (!newEmail || !newPass || !newRole) return;
    setMsg(null);
    setLoading(true);
    try {
      await AdminAPI.createUser(newEmail, newPass, newRole);
      setMsg(`Usuario ${newEmail} creado.`);
      setNewEmail("");
      setNewPass("");
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  function startEdit(u: AdminUser) {
    setEditing((prev) => ({ ...prev, [u.id]: true }));
    setEditBuffer((prev) => ({
      ...prev,
      [u.id]: { email: u.email, role: u.role, password: "" },
    }));
  }

  function cancelEdit(id: string) {
    setEditing((prev) => ({ ...prev, [id]: false }));
  }

  function onChangeEdit(
    id: string,
    patch: Partial<{
      name: string;
      email: string;
      role: string;
      password?: string;
    }>
  ) {
    setEditBuffer((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveEdit(u: AdminUser) {
    const buf = editBuffer[u.id];
    if (!buf) return;
    setBusyRow((b) => ({ ...b, [u.id]: true }));
    setMsg(null);
    try {
      // Si el campo no se modificó, usa el valor anterior
      const email = buf.email || u.email;
      const role = buf.role || u.role;
      // Solo envía la contraseña si se escribió una nueva
      const password =
        buf.password && buf.password.length > 0 ? buf.password : undefined;
      await AdminAPI.updateUser(u.id, email, role, password);
      setMsg(`Usuario ${u.email} actualizado.`);
      setEditing((e) => ({ ...e, [u.id]: false }));
      await refresh();
    } finally {
      setBusyRow((b) => ({ ...b, [u.id]: false }));
    }
  }

  async function removeUser(u: AdminUser) {
    const ok = window.confirm(
      `¿Eliminar al usuario ${u.email}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    setBusyRow((b) => ({ ...b, [u.id]: true }));
    setMsg(null);
    try {
      await AdminAPI.deleteUser(u.id);
      setMsg(`Usuario ${u.email} eliminado.`);
      await refresh();
    } catch (e: any) {
      setMsg(e?.message ? `Error: ${e.message}` : "Error al eliminar usuario");
    } finally {
      setBusyRow((b) => ({ ...b, [u.id]: false }));
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Administración de Usuarios
          </h1>
          <p className="text-slate-600 text-sm">
            Crea, edita o elimina cuentas.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-white/70 backdrop-blur ring-1 ring-white/40 shadow-sm">
            Total usuarios: <span className="font-bold">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <Input
          placeholder="Buscar por nombre, email, rol o dependencia…"
          value={filter}
          onChange={(e: any) => setFilter(e.target.value)}
          className="w-full rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-300/40"
        />
      </div>

      {/* Crear */}
      <div className="rounded-2xl p-4 mb-6 bg-white/70 backdrop-blur ring-1 ring-white/40 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-3">Crear usuario</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="Email"
            type="email"
            value={newEmail}
            onChange={(e: any) => setNewEmail(e.target.value)}
            className="rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-300/40"
          />
          <Input
            placeholder="Contraseña"
            type="password"
            value={newPass}
            onChange={(e: any) => setNewPass(e.target.value)}
            className="rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-300/40"
          />
          <Select
            value={newRole}
            onChange={(e: any) => setNewRole(e.target.value)}
            className="rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-300/40"
          >
            <option value="">Seleccione rol</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-3">
          <Button
            onClick={createUser}
            disabled={!newEmail || !newPass || !newRole}
            className="rounded-xl px-4 py-2 font-semibold text-white shadow-md hover:shadow-lg transition-shadow
                       bg-[linear-gradient(135deg,#FFD700_0%,#FFF176_100%)]"
          >
            Crear usuario
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="rounded-2xl p-4 bg-white/70 backdrop-blur ring-1 ring-white/40 shadow-sm animate-pulse h-56"
            >
              <div className="h-5 w-2/3 bg-slate-200 rounded mb-3" />
              <div className="h-4 w-1/2 bg-slate-200 rounded mb-4" />
              <div className="h-24 w-full bg-slate-100 rounded" />
            </div>
          ))}

        {!loading &&
          filtered.map((u) => {
            const isEditing = !!editing[u.id];
            const rowBusy = !!busyRow[u.id];
            const buf = editBuffer[u.id];

            return (
              <div
                key={u.id}
                className="rounded-2xl p-4 bg-white/70 backdrop-blur ring-1 ring-white/40 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 leading-snug">
                      {isEditing ? (
                        <span className="text-slate-600">{u.email}</span>
                      ) : (
                        <span className="text-slate-600">{u.email}</span>
                      )}
                    </h3>
                    {u.role === "Solver" && (
                      <div className="mt-2 text-sm text-amber-700 bg-amber-100/60 rounded-md p-2 ring-1 ring-amber-200">
                        <strong>Aviso:</strong> Los usuarios con rol "Solver"
                        solo pueden gestionar PQRs asignados a su dependencia.
                      </div>
                    )}

                    <div className="mt-1 text-sm text-slate-700">
                      {isEditing ? (
                        <div className="mt-1 text-sm text-slate-700 flex flex-col gap-2">
                          <Input
                            type="email"
                            value={buf?.email ?? ""}
                            onChange={(e: any) =>
                              onChangeEdit(u.id, { email: e.target.value })
                            }
                            className="rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-300/40"
                          />
                          <Input
                            type="password"
                            placeholder="Nueva contraseña (opcional)"
                            value={buf?.password ?? ""}
                            onChange={(e: any) =>
                              onChangeEdit(u.id, { password: e.target.value })
                            }
                            className="rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-300/40"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-600">{u.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <Select
                        value={buf?.role ?? u.role}
                        onChange={(e: any) =>
                          onChangeEdit(u.id, { role: e.target.value })
                        }
                        className="rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-300/40"
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 ring-1 ring-slate-200">
                        {u.role || "-"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1">
                    ID: <span className="font-mono">{u.id.slice(0, 8)}…</span>
                  </span>
                  {u.dependence && (
                    <span className="inline-flex items-center gap-1">
                      Dep.:{" "}
                      <span className="font-semibold">{u.dependence.name}</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-1">
                  {!isEditing ? (
                    <>
                      <Button
                        onClick={() => startEdit(u)}
                        className="rounded-xl px-4 py-2 font-semibold text-slate-900 bg-white/70 ring-1 ring-slate-200 hover:bg-white transition"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => removeUser(u)}
                        disabled={rowBusy}
                        className="rounded-xl px-4 py-2 font-semibold text-white shadow-md hover:shadow-lg transition-shadow bg-rose-500/90"
                      >
                        {rowBusy ? "Eliminando…" : "Eliminar"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => saveEdit(u)}
                        disabled={rowBusy}
                        className="rounded-xl px-4 py-2 font-semibold text-white shadow-md hover:shadow-lg transition-shadow
                                   bg-[linear-gradient(135deg,#FFD700_0%,#FFF176_100%)]"
                      >
                        {rowBusy ? "Guardando…" : "Guardar"}
                      </Button>
                      <Button
                        onClick={() => cancelEdit(u.id)}
                        className="rounded-xl px-4 py-2 font-semibold text-black bg-white/70 ring-1 ring-slate-200 hover:bg-white transition"
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {msg && (
        <div className="fixed bottom-6 right-6">
          <div className="flex items-center gap-2 rounded-2xl px-4 py-3 bg-white/80 backdrop-blur ring-1 ring-white/40 shadow-lg">
            <span className="inline-block h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-200 grid place-items-center text-slate-900 text-sm font-bold">
              ✓
            </span>
            <span className="text-sm font-medium text-slate-900">{msg}</span>
            <button
              className="ml-1 text-xs text-slate-500 hover:text-slate-700"
              onClick={() => setMsg(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
