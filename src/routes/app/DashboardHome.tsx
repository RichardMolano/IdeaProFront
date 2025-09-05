import { ChatAPI } from "../../api/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../store/auth";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import PieChartIcon from "@mui/icons-material/PieChart";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as ReTooltip,
} from "recharts";

type StatState = {
  totalChats: number;
  openChats: number;
  resolvedChats: number;
  inProgressChats: number;
  closedChats: number;
};

type SolverAgg = { email: string; tasks: number };

// util seguro para números
const toCount = (v: any) => Math.max(0, Number(v) || 0);

export default function DashboardHome() {
  const { user, token } = useAuth();

  const [stats, setStats] = useState<StatState>({
    totalChats: 0,
    openChats: 0,
    resolvedChats: 0,
    inProgressChats: 0,
    closedChats: 0,
  });
  const [solvers, setSolvers] = useState<SolverAgg[]>([]);
  const [loading, setLoading] = useState(true);

  // refs para controlar SSE/polling
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<number | null>(null);
  const retryRef = useRef<number>(0);

  useEffect(() => {
    if (!token || !(user?.role === "Admin" || user?.role === "Solver")) return;

    let cancelled = false;

    const applyChats = (chats: any[]) => {
      const openChats = toCount(
        chats.filter((c) => c?.status === "OPEN").length
      );
      const resolvedChats = toCount(
        chats.filter((c) => c?.status === "RESOLVED").length
      );
      const inProgressChats = toCount(
        chats.filter((c) => c?.status === "IN_PROGRESS").length
      );
      const closedChats = toCount(
        chats.filter((c) => c?.status === "CLOSED").length
      );

      setStats({
        totalChats: toCount(chats?.length),
        openChats,
        resolvedChats,
        inProgressChats,
        closedChats,
      });

      const solverMap: Record<string, number> = {};
      chats?.forEach((g: any) => {
        if (Array.isArray(g?.assignments)) {
          g.assignments.forEach((a: any) => {
            const email = a?.solver_user?.email;
            if (email) solverMap[email] = (solverMap[email] || 0) + 1;
          });
        }
      });
      setSolvers(
        Object.entries(solverMap).map(([email, tasks]) => ({ email, tasks }))
      );
      setLoading(false);
    };

    const startPolling = () => {
      // Limpia SSE si estuviera
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      // Evita duplicados
      if (pollRef.current) window.clearInterval(pollRef.current);

      const poll = async () => {
        try {
          const chats = (ChatAPI as any).groupsWithDetails
            ? await (ChatAPI as any).groupsWithDetails()
            : await ChatAPI.groups();
          if (!cancelled) applyChats(chats || []);
        } catch {
          // no rompe UI
          if (!cancelled) setLoading(false);
        }
      };

      // dispara ya y luego cada 6s
      poll();
      pollRef.current = window.setInterval(poll, 6000);
    };

    const startSSE = () => {
      // si no existe EventSource (SSR o navegador raro), usar polling
      if (
        typeof window === "undefined" ||
        typeof window.EventSource === "undefined"
      ) {
        startPolling();
        return;
      }

      try {
        // evita múltiples conexiones
        if (sseRef.current) sseRef.current.close();

        setLoading(true);
        sseRef.current = new window.EventSource("/api/dashboard/stream", {
          withCredentials: false, // CORS: asegúrate de habilitar en backend si es cross-origin
        });

        sseRef.current.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            const chats = payload?.chats || [];
            if (!cancelled) applyChats(chats);
            // reset de reintentos en mensaje ok
            retryRef.current = 0;
          } catch {
            // fallback si paquete inválido
          }
        };

        sseRef.current.onerror = () => {
          // Cierra y reintenta con backoff, luego cae a polling si insiste
          if (sseRef.current) {
            sseRef.current.close();
            sseRef.current = null;
          }
          const attempt = Math.min(retryRef.current + 1, 5);
          retryRef.current = attempt;
          const delay = attempt * 1500; // 1.5s, 3s, 4.5s, ...

          // Pequeño timeout para no dejar spinner infinito
          setTimeout(() => {
            if (!cancelled) setLoading(false);
          }, 1200);

          // Después del 3er intento, usa polling estable
          if (attempt >= 3) {
            startPolling();
          } else {
            setTimeout(() => {
              if (!cancelled) startSSE();
            }, delay);
          }
        };
      } catch {
        // si falla crear SSE, cae a polling
        startPolling();
      }
    };

    // Arranca por SSE
    startSSE();

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
  }, [token, user]);
  // Datos del pastel (declarados antes del return para no romper el orden de hooks)
  const chartData = useMemo(
    () => [
      { name: "Abiertos", value: toCount(stats.openChats) },
      { name: "En progreso", value: toCount(stats.inProgressChats) },
      { name: "Resueltos", value: toCount(stats.resolvedChats) },
      { name: "Cerrados", value: toCount(stats.closedChats) },
    ],
    [stats]
  );

  // Paleta dorada (claro → oscuro)
  const PIE_COLORS = ["#FFF59D", "#FFE066", "#FFC300", "#B8860B"];

  const total = chartData.reduce((acc, d) => acc + d.value, 0);
  const hasData = total > 0;

  // Etiquetas: sólo si ≥ 3% para evitar solapamiento
  const renderLabel = (d: any) => {
    if (!hasData || !d || d.value <= 0) return undefined;
    const pct = (d.value / total) * 100;
    if (pct < 3) return undefined;
    return `${d.name}: ${Math.round(pct)}%`;
  };

  if (!token || !(user?.role === "Admin" || user?.role === "Solver")) {
    return (
      <Box sx={{ mt: 10, textAlign: "center" }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Bienvenido al sistema PQRSD
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Inicia sesión para acceder a las funcionalidades.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Bienvenido a la plataforma PQRSD
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Aquí puedes gestionar tus solicitudes, ver el estado de tus chats y
        acceder a las funcionalidades según tu rol.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" },
          gap: 3,
        }}
      >
        {/* Resumen de cantidades */}
        <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 5" } }}>
          <Card
            elevation={6}
            sx={{
              borderRadius: 4,
              background: "rgba(255,255,255,0.25)",
              boxShadow: "0 8px 32px 0 rgba(31,38,135,0.17)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
              height: "100%",
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen de chats
              </Typography>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Total de chats"
                      secondary={stats.totalChats}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Abiertos"
                      secondary={stats.openChats}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="En progreso"
                      secondary={stats.inProgressChats}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Resueltos"
                      secondary={stats.resolvedChats}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Cerrados"
                      secondary={stats.closedChats}
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Gráfico de pastel */}
        <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 7" } }}>
          <Card
            elevation={6}
            sx={{
              borderRadius: 4,
              background: "rgba(255,255,255,0.25)",
              boxShadow: "0 8px 32px 0 rgba(31,38,135,0.17)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PieChartIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Distribución por estado</Typography>
              </Box>

              <Paper
                sx={{
                  width: "100%",
                  height: 300,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "grey.100",
                  borderRadius: 3,
                  boxShadow: "0 4px 16px 0 rgba(31,38,135,0.12)",
                }}
              >
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ReTooltip />
                      <Legend />
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        innerRadius={50}
                        paddingAngle={3}
                        labelLine={false}
                        label={renderLabel}
                        isAnimationActive={false}
                      >
                        {chartData.map((entry, idx) => (
                          <Cell
                            key={`slice-${idx}`}
                            fill={PIE_COLORS[idx % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                    <Typography variant="body1" fontWeight={600}>
                      Sin datos para mostrar
                    </Typography>
                    <Typography variant="body2">
                      Cuando existan chats, verás su distribución aquí.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabla de solvers */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom>
          Solvers y tareas asignadas
        </Typography>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress />
          </Box>
        ) : solvers.length === 0 ? (
          <Typography color="text.secondary">
            No hay solvers con tareas asignadas.
          </Typography>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              background: "rgba(255,255,255,0.25)",
              boxShadow: "0 4px 16px 0 rgba(31,38,135,0.12)",
              backdropFilter: "blur(4px)",
              borderRadius: 3,
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Tareas asignadas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {solvers.map((s) => (
                  <TableRow key={s.email}>
                    <TableCell>{s.email}</TableCell>
                    <TableCell align="right">{s.tasks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
