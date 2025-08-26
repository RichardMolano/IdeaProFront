import { AssignAPI, ChatAPI } from "../../api/client";
import { useEffect, useState } from "react";
import { Button, Select } from "../../ui/Form";

type Group = { id: string };
type Solver = { id: string; email: string };

export default function AssignPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [solvers, setSolvers] = useState<Solver[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedSolver, setSelectedSolver] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    ChatAPI.groups().then(setGroups);
    AssignAPI.solvers().then(setSolvers);
  }, []);

  async function assign() {
    setMsg(null);
    await AssignAPI.assign(selectedGroup, selectedSolver);
    setMsg("Asignado.");
  }

  async function unassign() {
    setMsg(null);
    await AssignAPI.unassign(selectedGroup, selectedSolver);
    setMsg("Desasignado.");
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Asignar Solver a Chat</h1>
      <div className="space-y-2">
        <Select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">Seleccione Chat</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.id}
            </option>
          ))}
        </Select>
        <Select
          value={selectedSolver}
          onChange={(e) => setSelectedSolver(e.target.value)}
        >
          <option value="">Seleccione Solver</option>
          {solvers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.email}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Button onClick={assign} disabled={!selectedGroup || !selectedSolver}>
            Asignar
          </Button>
          <Button
            onClick={unassign}
            disabled={!selectedGroup || !selectedSolver}
          >
            Desasignar
          </Button>
        </div>
        {msg && <div className="text-green-700 text-sm">{msg}</div>}
      </div>
    </div>
  );
}
