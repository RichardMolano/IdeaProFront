import { AssignAPI, ChatAPI } from "../../api/client";
import { useEffect, useState } from "react";
import { Button, Select } from "../../ui/Form";

type Group = {
  id: string;
  status?: string;
  priority?: string;
  pqr?: {
    id: string;
    title?: string;
    description?: string;
    client_user?: { email?: string };
    status?: string;
    priority?: string;
    dependence?: { name?: string };
  };
  assignments?: Array<{
    id: string;
    solver_user?: { email?: string };
    created_at?: string;
  }>;
};
type Solver = { id: string; email: string; dependence?: { name: string } };

function StatusChip({ value }: { value?: string }) {
  const v = (value || "-").toUpperCase();
  const map: Record<string, string> = {
    OPEN: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    IN_PROGRESS: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
    RESOLVED: "bg-sky-100 text-sky-900 ring-1 ring-sky-200",
    CLOSED: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
    "-": "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        map[v] || map["-"]
      }`}
    >
      {v === "IN_PROGRESS" ? "EN PROGRESO" : v}
    </span>
  );
}

function PriorityChip({ value }: { value?: string }) {
  const v = (value || "-").toUpperCase();
  const map: Record<string, string> = {
    HIGH: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
    MEDIUM: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
    LOW: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
    "-": "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        map[v] || map["-"]
      }`}
    >
      {v === "-" ? "SIN PRIORIDAD" : v}
    </span>
  );
}

export default function AssignPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [solvers, setSolvers] = useState<Solver[]>([]);
  const [selectedSolverByGroup, setSelectedSolverByGroup] = useState<
    Record<string, string>
  >({});
  const [msg, setMsg] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [gs, ss] = await Promise.all([
          ChatAPI.groupsWithDetails(),
          AssignAPI.solvers(),
        ]);
        if (!mounted) return;
        setGroups(gs);
        setSolvers(ss);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    // --- STREAM: actualiza en tiempo real usando SSE ---
    const sse = new window.EventSource("/api/assignments/stream");
    sse.onmessage = (event) => {
      // El backend debe enviar los datos en JSON
      try {
        const data = JSON.parse(event.data);
        if (data.groups) setGroups(data.groups);
        if (data.solvers) setSolvers(data.solvers);
      } catch {}
    };
    sse.onerror = () => {
      sse.close();
    };
    return () => {
      mounted = false;
      sse.close();
    };
  }, []);

  async function assign(groupId: string) {
    const solverId = selectedSolverByGroup[groupId];
    if (!solverId) return;
    setBusy((b) => ({ ...b, [groupId]: true }));
    setMsg(null);
    try {
      await AssignAPI.assign(groupId, solverId);
      setMsg(`Asignado el chat ${groupId}.`);
      // refresco rápido del grupo
      const gs = await ChatAPI.groupsWithDetails();
      setGroups(gs);
    } finally {
      setBusy((b) => ({ ...b, [groupId]: false }));
    }
  }

  async function unassign(groupId: string) {
    const solverId = selectedSolverByGroup[groupId];
    if (!solverId) return;
    setBusy((b) => ({ ...b, [groupId]: true }));
    setMsg(null);
    try {
      await AssignAPI.unassign(groupId, solverId);
      setMsg(`Desasignado el chat ${groupId}.`);
      const gs = await ChatAPI.groupsWithDetails();
      setGroups(gs);
    } finally {
      setBusy((b) => ({ ...b, [groupId]: false }));
    }
  }

  function handleSolverChange(groupId: string, solverId: string) {
    setSelectedSolverByGroup((prev) => ({ ...prev, [groupId]: solverId }));
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Asignaciones de Chats
          </h1>
          <p className="text-slate-600 text-sm">
            Asigna o retira responsables en cada conversación.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-white/70 backdrop-blur ring-1 ring-white/40 shadow-sm">
            Total chats: <span className="font-bold">{groups.length}</span>
          </div>
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
          groups.map((g) => {
            const last =
              g.assignments && g.assignments.length > 0
                ? g.assignments[g.assignments.length - 1]
                : null;
            const assignedSolverEmail =
              last?.solver_user?.email || "Sin asignar";
            const isOpen = !!showDetail[g.id];

            return (
              <div
                key={g.id}
                className="rounded-2xl p-4 bg-white/70 backdrop-blur ring-1 ring-white/40 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col gap-3"
              >
                {/* Header título + chips */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-lg text-slate-900 leading-snug">
                      {g.pqr?.title || `Chat #${g.id.slice(0, 8)}…`}
                    </h3>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusChip value={g.status || g.pqr?.status} />
                    <PriorityChip value={g.priority || g.pqr?.priority} />
                    <span className="text-xs text-slate-500">
                      ID: <span className="font-mono">{g.id.slice(0, 8)}…</span>
                    </span>
                  </div>
                </div>

                {/* Info básica */}
                <div className="text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Usuario:</span>
                    <span className="truncate">
                      {g.pqr?.client_user?.email || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Asignado a:</span>
                    <span
                      className={`${
                        assignedSolverEmail === "Sin asignar"
                          ? "text-slate-500"
                          : "text-slate-900"
                      }`}
                    >
                      {assignedSolverEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Dependencia:</span>
                    <span
                      className={`${
                        g.pqr?.dependence?.name === "Sin asignar"
                          ? "text-slate-500"
                          : "text-slate-900"
                      }`}
                    >
                      {g.pqr?.dependence?.name || "-"}
                    </span>
                  </div>
                </div>

                {/* Detalle colapsable */}
                <div className="mt-1">
                  <button
                    type="button"
                    className="text-sm font-semibold text-slate-800 hover:text-slate-900 inline-flex items-center gap-2"
                    onClick={() =>
                      setShowDetail((prev) => ({
                        ...prev,
                        [g.id]: !prev[g.id],
                      }))
                    }
                  >
                    <span className="inline-block h-5 w-5 rounded-full bg-gradient-to-br from-amber-400 to-yellow-200 text-slate-900 grid place-items-center text-xs shadow">
                      {isOpen ? "–" : "+"}
                    </span>
                    {isOpen ? "Ocultar detalle" : "Ver detalle del problema"}
                  </button>
                  <div
                    className={`transition-all duration-200 will-change-[max-height,opacity] overflow-hidden ${
                      isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="mt-2 bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-sm text-slate-800">
                      <div>
                        <span className="font-semibold">Descripción:</span>{" "}
                        {g.pqr?.description || "Sin descripción"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selector + acciones */}
                <div className="mt-1">
                  <Select
                    className="w-full rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-300/40"
                    value={selectedSolverByGroup[g.id] || ""}
                    onChange={(e: any) =>
                      handleSolverChange(g.id, e.target.value)
                    }
                  >
                    <option value="">Seleccione Solver/Admin</option>
                    {Array.from(
                      new Set(
                        solvers.map(
                          (solver) =>
                            solver.dependence?.name || "Sin Dependencia"
                        )
                      )
                    ).map((dependenceName) => (
                      <optgroup
                        key={dependenceName}
                        label={
                          dependenceName === "Sin Dependencia"
                            ? "Sin Dependencia"
                            : `Dependencia: ${dependenceName}`
                        }
                      >
                        {solvers
                          .filter(
                            (solver) =>
                              solver.dependence?.name === dependenceName ||
                              (!solver.dependence &&
                                dependenceName === "Sin Dependencia")
                          )
                          .map((solver) => (
                            <option key={solver.id} value={solver.id}>
                              {solver.email}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </Select>

                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => assign(g.id)}
                      disabled={!selectedSolverByGroup[g.id] || !!busy[g.id]}
                      className="rounded-xl px-4 py-2 font-semibold text-black shadow-md hover:shadow-lg transition-shadow
                               bg-[linear-gradient(135deg,#FFD700_0%,#FFF176_100%)]"
                    >
                      {busy[g.id] ? "Asignando…" : "Asignar"}
                    </Button>
                    <Button
                      onClick={() => unassign(g.id)}
                      disabled={!selectedSolverByGroup[g.id] || !!busy[g.id]}
                      className="rounded-xl px-4 py-2 font-semibold text-black bg-white/70 ring-1 ring-slate-200 hover:bg-white transition"
                    >
                      {busy[g.id] ? "Quitando…" : "Desasignar"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Toast / mensaje */}
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
