import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import SendRounded from "@mui/icons-material/SendRounded";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatAPI, ImageAPI, UserAPI } from "../../api/client";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const LAYOUT_H = "72vh"; // altura fija para permitir scroll interno

export default function ChatPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadedImgUrl, setUploadedImgUrl] = useState<string | null>(null);
  const me = UserAPI.getUserInfoFromToken();
  const isAdminOrSolver = me?.role === "Admin" || me?.role === "Solver";
  const isSmall = useMediaQuery("(max-width:900px)");

  const [groups, setGroups] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<number | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const isClosed = (active?.status || "").toUpperCase() === "CLOSED";
  const canWrite = !!active && !isClosed;

  const statusChipColor = (s?: string) => {
    switch ((s || "").toUpperCase()) {
      case "OPEN":
        return "success";
      case "IN_PROGRESS":
        return "warning";
      case "RESOLVED":
        return "info";
      case "CLOSED":
        return "error";
      default:
        return "default";
    }
  };
  const priorityChipColor = (p?: string) => {
    switch ((p || "").toUpperCase()) {
      case "HIGH":
        return "error";
      case "MEDIUM":
        return "warning";
      case "LOW":
        return "success";
      default:
        return "default";
    }
  };

  // colores para estilizar Select según estado (borde/label)
  const statusAccent = (s?: string) => {
    const v = (s || "").toUpperCase();
    if (v === "OPEN") return "#2e7d32";
    if (v === "IN_PROGRESS") return "#f9a825";
    if (v === "RESOLVED") return "#1565c0";
    if (v === "CLOSED") return "#c62828";
    return undefined;
  };

  // Carga de grupos via SSE con fallback a polling
  useEffect(() => {
    let cancelled = false;

    const applyGroups = (data: any[]) => {
      if (cancelled) return;
      setGroups(data);
      if (active && !data.find((g: any) => g.id === active.id)) setActive(null);
    };

    // Fallback polling
    const startPolling = () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      const fetchGroups = async () => {
        try {
          const data =
            (await (ChatAPI as any).groupsWithDetails?.()) ||
            (await ChatAPI.groups());
          applyGroups(data || []);
        } catch {
          // noop
        }
      };
      fetchGroups();
      pollRef.current = window.setInterval(
        fetchGroups,
        5000
      ) as unknown as number;
    };

    // SSE si existe EventSource
    if (typeof window !== "undefined" && "EventSource" in window) {
      try {
        sseRef.current = new window.EventSource("/api/chat/groups/stream");
        sseRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            applyGroups(data);
          } catch {
            // si payload inválido, ignorar
          }
        };
        sseRef.current.onerror = () => {
          // cae a polling
          if (sseRef.current) {
            sseRef.current.close();
            sseRef.current = null;
          }
          startPolling();
        };
      } catch {
        startPolling();
      }
    } else {
      startPolling();
    }

    return () => {
      cancelled = true;
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  // Poll de mensajes del activo
  useEffect(() => {
    if (!active?.id) {
      setMsgs([]);
      return;
    }
    let timer: number | null = null;
    let cancelled = false;

    async function loadOnce(groupId: string) {
      try {
        setLoadingMsgs(true);
        const data = await ChatAPI.messages(groupId);
        if (!cancelled) setMsgs(data || []);
      } catch {
        /* noop */
      } finally {
        if (!cancelled) setLoadingMsgs(false);
      }
      if (!cancelled)
        timer = window.setTimeout(
          () => loadOnce(groupId),
          1500
        ) as unknown as number;
    }

    loadOnce(active.id);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [active?.id]);

  // Autoscroll al último mensaje
  // Autoscroll solo cuando se envía un mensaje
  const [shouldScroll, setShouldScroll] = useState(false);
  useEffect(() => {
    if (shouldScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setShouldScroll(false);
    }
  }, [msgs.length, shouldScroll]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault?.();
    if (!canWrite || (!text.trim() && !uploadedImgUrl)) return;
    setSending(true);
    try {
      await ChatAPI.send(
        me?.id,
        active!.id,
        text.trim(),
        uploadedImgUrl || undefined,
        uploadedImgUrl ? "image" : undefined
      );
      setText("");
      setUploadedImgUrl(null);
      setImageFile(null);
      setImagePreview(null);
      setShouldScroll(true);
    } finally {
      setSending(false);
    }
  }

  const statusBorderSx = useMemo(() => {
    const color = statusAccent(active?.status);
    if (!color) return {};
    return {
      "& .MuiOutlinedInput-notchedOutline": { borderColor: `${color}55` },
      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: `${color}88` },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: color },
      "& .MuiInputLabel-root": { color: `${color}cc` },
      "&.Mui-focused .MuiInputLabel-root": { color },
    } as const;
  }, [active?.status]);

  return (
    <Box
      sx={{
        height: LAYOUT_H,
        width: "min(100%, 1100px)",
        mx: "auto",
        my: "auto",
        p: 2,
        display: "grid",
        gridTemplateColumns: isSmall ? "1fr" : "320px 1fr",
        gridTemplateRows: isSmall ? "280px 1fr" : "1fr",
        gap: 2,
      }}
    >
      {/* Sidebar (scrollable) */}
      <Paper
        elevation={3}
        sx={{
          height: "100%",
          overflow: "hidden",
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" fontWeight={800}>
            Mis Chats
          </Typography>
        </Box>

        <List
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 1,
            scrollBehavior: "smooth",
          }}
        >
          {groups.length === 0 && (
            <ListItem>
              <Typography color="text.secondary">
                No tienes chats aún.
              </Typography>
            </ListItem>
          )}
          {groups.map((g) => {
            const selected = active?.id === g.id;
            return (
              <ListItem disablePadding key={g.id} sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={selected}
                  onClick={() => setActive(g)}
                  sx={{
                    borderRadius: 2,
                    px: 1.5,
                    py: 1,
                    bgcolor: selected ? "#000" : "#fff",
                    color: selected ? "#fff" : "#000",
                    boxShadow: selected ? 2 : 0,
                    "&:hover": {
                      bgcolor: selected ? "#000" : "#f5f5f5",
                    },
                  }}
                >
                  <Avatar
                    sx={{ mr: 1.5 }}
                    src={g.pqr?.client_user?.avatar || undefined}
                  >
                    {g.pqr?.client_user?.email?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap fontWeight={700}>
                      {g.pqr?.client_user?.email || "Usuario"}
                    </Typography>
                    <Typography
                      variant="body2"
                      noWrap
                      color={selected ? "inherit" : "text.secondary"}
                    >
                      {g.pqr.dependence?.name || "Sin dependencia"}
                    </Typography>
                    <Typography
                      variant="body2"
                      noWrap
                      color={selected ? "inherit" : "text.primary"}
                    >
                      {g.pqr?.title || `Chat #${g.id.slice(0, 8)}…`}
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.75,
                        display: "flex",
                        gap: 0.5,
                        flexWrap: "wrap",
                      }}
                    >
                      <Chip
                        size="small"
                        label={g.status || "-"}
                        color={statusChipColor(g.status) as any}
                        variant={selected ? "filled" : "outlined"}
                        sx={{ height: 22 }}
                      />
                      <Chip
                        size="small"
                        label={g.priority || "-"}
                        color={priorityChipColor(g.priority) as any}
                        variant={selected ? "filled" : "outlined"}
                        sx={{ height: 22 }}
                      />
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Paper>

      {/* Panel de chat (scrollable) */}
      <Paper
        elevation={3}
        sx={{
          height: "100%",
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {active && (
              <Avatar src={active.pqr?.client_user?.avatar || undefined}>
                {active.pqr?.client_user?.email?.[0]?.toUpperCase() || "U"}
              </Avatar>
            )}
            <Box>
              <Typography variant="h6" fontWeight={800}>
                {active
                  ? active.pqr?.title || `Chat #${active.id.slice(0, 8)}…`
                  : "Selecciona un chat"}
              </Typography>
              {active && (
                <Box sx={{ display: "flex", gap: 0.5, mt: 0.25 }}>
                  <Chip
                    size="small"
                    label={active.priority || "-"}
                    color={priorityChipColor(active.priority) as any}
                    variant="outlined"
                  />
                </Box>
              )}
            </Box>
          </Box>

          {/* Selector de estado (sin color prop, estilizado via sx) */}
          {active && isAdminOrSolver && (
            <FormControl size="small" sx={{ minWidth: 220, ...statusBorderSx }}>
              <InputLabel id="status-label">Estado</InputLabel>
              <Select
                labelId="status-label"
                label="Estado"
                value={(active.status || "OPEN").toUpperCase()}
                onChange={async (e) => {
                  const status = String(e.target.value).toUpperCase();
                  if (active.status?.toUpperCase() === status) return;
                  // @ts-ignore
                  await (ChatAPI as any).setGroupStatus?.(active.id, status);
                  setActive((a) => (a ? { ...a, status } : a));
                  setGroups((gs) =>
                    gs.map((g) => (g.id === active.id ? { ...g, status } : g))
                  );
                }}
              >
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s === "OPEN"
                      ? "Abierta"
                      : s === "IN_PROGRESS"
                      ? "En progreso"
                      : s === "RESOLVED"
                      ? "Resuelta"
                      : "Cerrada"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Box sx={{ flexGrow: 1 }} />
          {active && (
            <Typography variant="body2" color="text.secondary">
              {(() => {
                const createdAt = new Date(active.pqr?.created_at).getTime();
                const daysSinceCreation = Math.floor(
                  (Date.now() - createdAt) / (1000 * 60 * 60 * 24)
                );
                if (daysSinceCreation > 15) {
                  return `Vencida hace ${daysSinceCreation - 15} días`;
                } else {
                  return `Creada hace ${daysSinceCreation} días · Quedan ${
                    15 - daysSinceCreation
                  } días`;
                }
              })()}
            </Typography>
          )}
        </Box>

        {/* Mensajes (scroll) */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            scrollBehavior: "smooth",
          }}
        >
          {loadingMsgs && (
            <Box sx={{ mb: 2 }}>
              <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
            </Box>
          )}
          {msgs.map((m) => {
            const senderEmail = m.sender_email || m.sender_user?.email;
            const mine = senderEmail === me?.email;
            return (
              <Box
                key={m.id}
                sx={{
                  display: "flex",
                  justifyContent: mine ? "flex-end" : "flex-start",
                  mb: 1.5,
                }}
              >
                <Box
                  sx={{
                    maxWidth: "75%",
                    bgcolor: mine ? "primary.50" : "grey.100",
                    border: "1px solid",
                    borderColor: mine ? "primary.100" : "grey.200",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.25 }}
                  >
                    {new Date(m.created_at).toLocaleString()} · {senderEmail}
                  </Typography>
                  {m.content && (
                    <Typography
                      sx={{ whiteSpace: "pre-wrap", mb: m.file_url ? 1 : 0 }}
                    >
                      {m.content}
                    </Typography>
                  )}
                  {m.file_url &&
                    (m.file_url.match(/\.(png|jpe?g|gif|bmp|webp)$/i) ? (
                      <img
                        src={m.file_url}
                        alt="Archivo adjunto"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "200px",
                          borderRadius: "15px",
                          cursor: "pointer",
                          marginTop: 4,
                        }}
                        onClick={() => window.open(m.file_url, "_blank")}
                      />
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          cursor: "pointer",
                          color: "white",
                          backgroundColor: "#1b86ff",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          marginTop: 4,
                        }}
                        onClick={() => window.open(m.file_url, "_blank")}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: "white",
                          }}
                        >
                          Archivo adjunto
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </Box>
            );
          })}
          <div ref={bottomRef} />
        </Box>

        <Divider />

        {/* Composer (Enter envía) */}
        {canWrite ? (
          <Box
            component="form"
            onSubmit={send}
            sx={{
              p: 1.25,
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "background.paper",
              flexWrap: "wrap",
            }}
          >
            <TextField
              fullWidth
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe un mensaje…"
              disabled={sending}
              onKeyDown={async (e) => {
                // Para IME (teclados chinos/japoneses) no interceptar
                // @ts-ignore
                if (e.isComposing) return;
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!sending && (text.trim() || uploadedImgUrl)) {
                    await send();
                  }
                }
              }}
              inputProps={{ "aria-label": "Escribir mensaje" }}
            />
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              id="chat-img-upload"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
                setUploadingImg(true);
                try {
                  const imgName = await ImageAPI.upload(file);

                  if (!imgName) {
                    throw new Error("No se recibió el nombre de la imagen");
                  }

                  const url = await ImageAPI.getRawImageUrl(imgName);
                  setUploadedImgUrl(url);
                } catch (err) {
                  console.error("Error al subir imagen:", err);
                  alert(
                    "Error al subir imagen. Por favor, inténtalo de nuevo."
                  );
                  setUploadedImgUrl(null);
                } finally {
                  setUploadingImg(false);
                }
              }}
            />
            <label htmlFor="chat-img-upload">
              <IconButton
                component="span"
                color={uploadingImg ? "secondary" : "primary"}
                disabled={uploadingImg || sending}
                sx={{
                  bgcolor: uploadingImg ? "grey.300" : "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                <span role="img" aria-label="subir imagen">
                  📄
                </span>
              </IconButton>
            </label>
            <IconButton
              type="submit"
              color="primary"
              disabled={sending || (!text.trim() && !uploadedImgUrl)}
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              <SendRounded />
            </IconButton>
            {imagePreview && (
              <Box sx={{ ml: 2, display: "flex", alignItems: "center" }}>
                {imagePreview &&
                imageFile?.type.match(/image\/(png|jpe?g|gif|bmp|webp)/i) ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    style={{
                      maxHeight: 48,
                      borderRadius: 8,
                      border: "1px solid #ccc",
                    }}
                  />
                ) : (
                  <span
                    role="img"
                    aria-label="archivo adjunto"
                    style={{
                      fontSize: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      border: "1px solid #ccc",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    📎
                  </span>
                )}
                {uploadingImg && (
                  <Typography sx={{ ml: 1 }} color="text.secondary">
                    Subiendo…
                  </Typography>
                )}
                {uploadedImgUrl && (
                  <Typography sx={{ ml: 1, color: "green" }}>
                    Lista para enviar
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 1.5, textAlign: "center" }}>
            <Chip
              label={
                !active
                  ? "Selecciona un chat para comenzar"
                  : "Chat cerrado: no se pueden enviar mensajes"
              }
              color={active ? "default" : "info"}
              variant="outlined"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
