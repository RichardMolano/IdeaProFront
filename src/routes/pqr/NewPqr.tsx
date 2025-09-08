import { PqrAPI } from "../../api/client";
import { useState, useEffect } from "react";
import { DependenceAPI } from "../../api/client";
import { Button, Input, Select, Textarea } from "../../ui/Form";

export default function NewPqr() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [dependenceId, setDependenceId] = useState<string>("");
  const [dependences, setDependences] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // Cargar dependencias al montar
  useEffect(() => {
    DependenceAPI.list().then(setDependences);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!dependenceId) {
      setMsg("Debes seleccionar una dependencia.");
      return;
    }
    await PqrAPI.create(title, description, priority, dependenceId);
    setMsg("PQR creado. Se generó el chat.");
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setDependenceId("");
  }
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Crear PQR</h1>
      <form onSubmit={submit} className="space-y-3">
        <Input
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
        >
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
        </Select>
        <Select
          value={dependenceId}
          onChange={(e) => setDependenceId(e.target.value)}
          required
        >
          <option value="">Selecciona una dependencia</option>
          {dependences.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Button type="submit" className="text-white">
          Crear
        </Button>
        {msg && <div className="text-green-700 text-sm">{msg}</div>}
      </form>
    </div>
  );
}
