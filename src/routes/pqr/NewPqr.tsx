import { PqrAPI } from "../../api/client";
import { useState } from "react";
import { Button, Input, Select, Textarea } from "../../ui/Form";

export default function NewPqr() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    await PqrAPI.create(title, description, priority);
    setMsg("PQR creado. Se generó el chat.");
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
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
        <Button type="submit">Crear</Button>
        {msg && <div className="text-green-700 text-sm">{msg}</div>}
      </form>
    </div>
  );
}
