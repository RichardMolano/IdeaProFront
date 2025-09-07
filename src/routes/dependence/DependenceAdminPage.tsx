import { useEffect, useState } from "react";
import {
  DependenceAPI,
  Dependence,
  CreateDependenceDto,
  UpdateDependenceDto,
} from "../../api/client";
import { Button, Input } from "../../ui/Form";

export default function DependenceAdminPage() {
  const [dependences, setDependences] = useState<Dependence[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const data = await DependenceAPI.list();
      setDependences(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createDependence() {
    if (!newName) return;
    setMsg(null);
    setLoading(true);
    try {
      await DependenceAPI.create({ name: newName });
      setMsg(`Dependencia "${newName}" creada.`);
      setNewName("");
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  function startEdit(dep: Dependence) {
    setEditId(dep.id);
    setEditName(dep.name);
  }

  async function saveEdit() {
    if (!editId || !editName) return;
    setMsg(null);
    setLoading(true);
    try {
      await DependenceAPI.update(editId, { name: editName });
      setMsg(`Dependencia actualizada.`);
      setEditId(null);
      setEditName("");
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function removeDependence(id: string) {
    const ok = window.confirm(
      "¿Eliminar esta dependencia? Esta acción no se puede deshacer."
    );
    if (!ok) return;
    setMsg(null);
    setLoading(true);
    try {
      await DependenceAPI.delete(id);
      setMsg("Dependencia eliminada.");
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Administrar Dependencias</h1>
      <div className="mb-6 p-4 bg-white/70 rounded-2xl shadow">
        <h2 className="font-semibold mb-2">Crear nueva dependencia</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Nombre de la dependencia"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-300/40"
          />
          <Button
            onClick={createDependence}
            disabled={!newName}
            className="rounded-xl px-4 py-2 font-semibold text-white bg-amber-500"
          >
            Crear
          </Button>
        </div>
      </div>
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Lista de dependencias</h2>
        {loading ? (
          <div>Cargando…</div>
        ) : (
          <ul className="space-y-2">
            {dependences.map((dep) => (
              <li
                key={dep.id}
                className="p-3 bg-white/70 rounded-xl shadow flex items-center justify-between"
              >
                {editId === dep.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-300/40 mr-2"
                    />
                    <Button
                      onClick={saveEdit}
                      className="rounded-xl px-3 py-1 font-semibold text-white bg-amber-500 mr-2"
                    >
                      Guardar
                    </Button>
                    <Button
                      onClick={() => {
                        setEditId(null);
                        setEditName("");
                      }}
                      className="rounded-xl px-3 py-1 font-semibold text-black bg-white/70 ring-1 ring-slate-200"
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-900">
                      {dep.name}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEdit(dep)}
                        className="rounded-xl px-3 py-1 font-semibold text-slate-900 bg-white/70 ring-1 ring-slate-200"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => removeDependence(dep.id)}
                        className="rounded-xl px-3 py-1 font-semibold text-white bg-rose-500/90"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
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
