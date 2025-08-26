import { ChatAPI, UserAPI } from "../../api/client";
import { useEffect, useRef, useState } from "react";
import { Button, Input } from "../../ui/Form";
import { log } from "console";

type Group = { id: string; status: string; priority: string };
type Message = {
  id: string;
  content: string;
  sender_user: { email: string };
  created_at: string;
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-emerald-100 text-emerald-800",
};

const STATUS_TRANSLATIONS: Record<
  string,
  { text: string; tooltip: string; cls: string }
> = {
  OPEN: {
    text: "Abierta",
    tooltip: "Chat abierto",
    cls: "bg-emerald-100 text-emerald-800",
  },
  IN_PROGRESS: {
    text: "En progreso",
    tooltip: "Chat en progreso",
    cls: "bg-amber-100 text-amber-800",
  },
  RESOLVED: {
    text: "Resuelta",
    tooltip: "Chat resuelto",
    cls: "bg-blue-100 text-blue-800",
  },
  CLOSED: {
    text: "Cerrada",
    tooltip: "Chat cerrado",
    cls: "bg-rose-100 text-rose-800",
  },
};

function getStatusText(status?: string) {
  const s = (status || "").toUpperCase();
  return STATUS_TRANSLATIONS[s]?.text || s;
}

function getStatusTooltip(status?: string) {
  const s = (status || "").toUpperCase();
  return STATUS_TRANSLATIONS[s]?.tooltip || s;
}

function statusBadge(status?: string) {
  const s = (status || "").toUpperCase();
  const info = STATUS_TRANSLATIONS[s];
  return info
    ? { dot: "", text: info.text, cls: info.cls }
    : { dot: "", text: s, cls: "bg-gray-100 text-gray-800" };
}

export default function ChatPage() {
  const me = UserAPI.getUserInfoFromToken();
  const canToggle = me?.role === "Admin" || me?.role === "Solver";

  const [groups, setGroups] = useState<Group[]>([]);
  const [active, setActive] = useState<Group | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 🔒 guard contra respuestas tardías
  const activeIdRef = useRef<string | null>(null);

  // Carga de grupos (como tenías)
  useEffect(() => {
    ChatAPI.groups().then(setGroups);
  }, []);

  // Polling (misma idea, pero blindado contra “cambios de chat”)
  useEffect(() => {
    // si no hay chat activo, limpia
    if (!active?.id) {
      activeIdRef.current = null;
      setMsgs([]);
      return;
    }

    activeIdRef.current = active.id;

    let timer: number | undefined;
    let cancelled = false;

    async function loadOnce(groupId: string) {
      try {
        const data = await ChatAPI.messages(groupId);
        // ⛔️ Ignora si ya cambiaste de chat o se canceló el efecto
        if (cancelled) return;
        if (activeIdRef.current !== groupId) return;
        setMsgs(data);
      } catch {
        // no-op
      }
      // reprograma solo si seguimos en el mismo chat
      if (!cancelled && activeIdRef.current === groupId) {
        timer = window.setTimeout(() => loadOnce(groupId), 1500);
      }
    }

    loadOnce(active.id);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [active?.id]);

  // Autoscroll (igual)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const isClosed = (active?.status || "").toUpperCase() === "CLOSED";
  const isAdminOrSolver = me?.role === "Admin" || me?.role === "Solver";

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !text.trim() || isClosed) return;
    setSending(true);
    try {
      await ChatAPI.send(active.id, text.trim());
      setText("");
      // el polling traerá el mensaje nuevo; no tocamos la lógica
    } finally {
      setSending(false);
    }
  }

  async function setStatus(newStatus: string) {
    if (!active || !isAdminOrSolver) return;
    try {
      // @ts-ignore
      await ChatAPI.setGroupStatus?.(active.id, newStatus);
      setActive({ ...active, status: newStatus });
      setGroups((gs) =>
        gs.map((g) => (g.id === active.id ? { ...g, status: newStatus } : g))
      );
    } catch {
      alert("No se pudo cambiar el estado del chat.");
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Lista de chats */}
      <div className="border rounded p-2">
        <div className="font-semibold mb-2">Mis Chats</div>
        <div className="space-y-1">
          {groups.map((g) => {
            const s = statusBadge(g.status);
            const pCls =
              PRIORITY_STYLES[(g.priority || "").toUpperCase()] ||
              "bg-gray-100 text-gray-800";
            return (
              <button
                key={g.id}
                onClick={() => setActive(g)}
                className={
                  "block w-full text-left px-2 py-2 rounded border " +
                  (active?.id === g.id
                    ? "bg-black text-white border-black"
                    : "hover:bg-gray-50 border-gray-200")
                }
              >
                <div className="flex items-center gap-2">
                  <div className="text-xs opacity-70">#{g.id.slice(0, 8)}…</div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${s.cls}`}
                    title={getStatusTooltip(g.status)}
                  >
                    {s.text}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${pCls}`}
                  >
                    Prioridad:{" "}
                    {g.priority
                      ? g.priority[0] + g.priority.slice(1).toLowerCase()
                      : "-"}
                  </span>
                </div>
              </button>
            );
          })}
          {groups.length === 0 && (
            <div className="text-sm text-gray-500 p-2">
              No tienes chats aún.
            </div>
          )}
        </div>
      </div>
      {/* Chat */}
      <div className="md:col-span-2 border rounded p-3 flex flex-col h-[70vh]">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">
            Chat {active ? `#${active.id.slice(0, 8)}…` : ""}
          </div>
          {active && isAdminOrSolver && (
            <div className="flex gap-2">
              {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((status) => (
                <Button
                  key={status}
                  type="button"
                  onClick={() => setStatus(status)}
                  className={
                    (active.status?.toUpperCase() === status
                      ? STATUS_TRANSLATIONS[status].cls +
                        " border-2 border-black "
                      : "bg-gray-200 text-gray-500 border border-gray-300 ") +
                    " text-sm px-3 py-1 rounded"
                  }
                  title={STATUS_TRANSLATIONS[status].tooltip}
                  disabled={active.status?.toUpperCase() === status}
                >
                  {STATUS_TRANSLATIONS[status].text}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`border rounded p-2 ${
                m.sender_user?.email === UserAPI.getUserInfoFromToken()?.email
                  ? "bg-blue-100 text-right"
                  : "bg-gray-100"
              }`}
            >
              <div className="text-xs text-gray-600">
                {new Date(m.created_at).toLocaleString()} ·{" "}
                {m.sender_user?.email}
              </div>
              <div>{m.content}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="mt-2 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              active
                ? isClosed
                  ? "Chat cerrado"
                  : "Escribe un mensaje…"
                : "Selecciona un chat…"
            }
            disabled={!active || isClosed || sending}
          />
          <Button type="submit" disabled={!active || isClosed || sending}>
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
