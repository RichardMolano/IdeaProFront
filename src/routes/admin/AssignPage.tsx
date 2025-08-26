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
  };
  assignments?: Array<{
    id: string;
    solver_user?: { email?: string };
    created_at?: string;
  }>;
};
type Solver = { id: string; email: string };

export default function AssignPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [solvers, setSolvers] = useState<Solver[]>([]);
  const [selectedSolverByGroup, setSelectedSolverByGroup] = useState<
    Record<string, string>
  >({});
  const [msg, setMsg] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<Record<string, boolean>>({});

  useEffect(() => {
    ChatAPI.groupsWithDetails().then(setGroups);
    AssignAPI.solvers().then(setSolvers);
  }, []);

  async function assign(groupId: string) {
    setMsg(null);
    const solverId = selectedSolverByGroup[groupId];
    if (!solverId) return;
    await AssignAPI.assign(groupId, solverId);
    setMsg(`Asignado el chat ${groupId}.`);
  }

  async function unassign(groupId: string) {
    setMsg(null);
    const solverId = selectedSolverByGroup[groupId];
    if (!solverId) return;
    await AssignAPI.unassign(groupId, solverId);
    setMsg(`Desasignado el chat ${groupId}.`);
  }

  function handleSolverChange(groupId: string, solverId: string) {
    setSelectedSolverByGroup((prev) => ({ ...prev, [groupId]: solverId }));
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">
        Asignar Solver/Admin a Chats
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => {
          // Obtener el último solver asignado (si hay)
          const lastAssignment =
            g.assignments && g.assignments.length > 0
              ? g.assignments[g.assignments.length - 1]
              : null;
          const assignedSolverEmail =
            lastAssignment?.solver_user?.email || "Sin asignar";
          return (
            <div
              key={g.id}
              className="border rounded-lg p-4 shadow bg-white flex flex-col gap-2"
            >
              <div className="font-bold text-lg">
                {g.pqr?.title || `Chat #${g.id.slice(0, 8)}…`}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                Usuario con problema: {g.pqr?.client_user?.email || "-"}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                Solver asignado: {assignedSolverEmail}
              </div>
              <Button
                type="button"
                className="mb-2 w-fit"
                onClick={() =>
                  setShowDetail((prev) => ({ ...prev, [g.id]: !prev[g.id] }))
                }
              >
                {showDetail[g.id]
                  ? "Ocultar detalle"
                  : "Ver detalle del problema"}
              </Button>
              {showDetail[g.id] && (
                <div className="bg-gray-50 p-2 rounded text-sm text-gray-800 mb-2">
                  <div>
                    <span className="font-semibold">Descripción:</span>{" "}
                    {g.pqr?.description || "Sin descripción"}
                  </div>
                </div>
              )}
              <Select
                value={selectedSolverByGroup[g.id] || ""}
                onChange={(e) => handleSolverChange(g.id, e.target.value)}
              >
                <option value="">Seleccione Solver/Admin</option>
                {solvers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.email}
                  </option>
                ))}
              </Select>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => assign(g.id)}
                  disabled={!selectedSolverByGroup[g.id]}
                >
                  Asignar
                </Button>
                <Button
                  onClick={() => unassign(g.id)}
                  disabled={!selectedSolverByGroup[g.id]}
                >
                  Desasignar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {msg && <div className="text-green-700 text-sm mt-4">{msg}</div>}
    </div>
  );
}
