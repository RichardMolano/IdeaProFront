import { ChatAPI } from "../../api/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../store/auth";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as ReTooltip,
} from "recharts";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

import MyPqr from "../../routes/pqr/MyPqr";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

// convierte a dayjs válido o null
const toDay = (v: any): Dayjs | null => {
  if (!v) return null;
  const d = dayjs(v);
  return d.isValid() ? d : null;
};

export default function DashboardHome() {
  const { user, token } = useAuth();

  // Estado base: chats crudos y loading
  const [rawChats, setRawChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtro de fechas
  const [dateStart, setDateStart] = useState<Dayjs | null>(null);
  const [dateEnd, setDateEnd] = useState<Dayjs | null>(null);

  // Derivados: stats y solvers en base al filtro
  const [stats, setStats] = useState<StatState>({
    totalChats: 0,
    openChats: 0,
    resolvedChats: 0,
    inProgressChats: 0,
    closedChats: 0,
  });
  const [solvers, setSolvers] = useState<SolverAgg[]>([]);

  // refs para controlar SSE/polling
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<number | null>(null);
  const retryRef = useRef<number>(0);

  // ---- FILTRADO POR FECHA (cliente) ----
  const filteredChats = useMemo(() => {
    if (!rawChats?.length) return [];
    const start = dateStart ? dateStart.startOf("day") : null;
    const end = dateEnd ? dateEnd.endOf("day") : null;

    return rawChats.filter((c: any) => {
      const ca = toDay(c?.pqr.created_at);
      if (!ca) return false; // si no tiene fecha, lo excluimos
      const gteStart = start ? ca.isSame(start) || ca.isAfter(start) : true;
      const lteEnd = end ? ca.isSame(end) || ca.isBefore(end) : true;
      return gteStart && lteEnd;
    });
  }, [rawChats, dateStart, dateEnd]);

  // Recalcular estadísticas cuando cambia el filtro o llegan nuevos datos
  useEffect(() => {
    const chats = filteredChats;
    const openChats = toCount(
      chats.filter((c: any) => c?.status === "OPEN").length
    );
    const resolvedChats = toCount(
      chats.filter((c: any) => c?.status === "RESOLVED").length
    );
    const inProgressChats = toCount(
      chats.filter((c: any) => c?.status === "IN_PROGRESS").length
    );
    const closedChats = toCount(
      chats.filter((c: any) => c?.status === "CLOSED").length
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
  }, [filteredChats]);

  useEffect(() => {
    if (!token || !(user?.role === "Admin" || user?.role === "Solver")) return;

    let cancelled = false;

    const applyChats = (chats: any[]) => {
      setRawChats(chats || []);
      setLoading(false);
    };

    const startPolling = () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      if (pollRef.current) window.clearInterval(pollRef.current);

      const poll = async () => {
        try {
          const chats = (ChatAPI as any).groupsWithDetails
            ? await (ChatAPI as any).groupsWithDetails()
            : await ChatAPI.groups();
          if (!cancelled) applyChats(chats || []);
        } catch {
          if (!cancelled) setLoading(false);
        }
      };

      poll();
      pollRef.current = window.setInterval(poll, 6000);
    };

    const startSSE = () => {
      if (
        typeof window === "undefined" ||
        typeof window.EventSource === "undefined"
      ) {
        startPolling();
        return;
      }

      try {
        if (sseRef.current) sseRef.current.close();
        setLoading(true);
        sseRef.current = new window.EventSource("/api/dashboard/stream", {
          withCredentials: false,
        });

        sseRef.current.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            const chats = payload?.chats || [];
            if (!cancelled) applyChats(chats);
            retryRef.current = 0;
          } catch {
            // paquete inválido: ignorar
          }
        };

        sseRef.current.onerror = () => {
          if (sseRef.current) {
            sseRef.current.close();
            sseRef.current = null;
          }
          const attempt = Math.min(retryRef.current + 1, 5);
          retryRef.current = attempt;
          const delay = attempt * 1500;

          setTimeout(() => {
            if (!cancelled) setLoading(false);
          }, 1200);

          if (attempt >= 3) {
            startPolling();
          } else {
            setTimeout(() => {
              if (!cancelled) startSSE();
            }, delay);
          }
        };
      } catch {
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

  // Datos del pastel
  const chartData = useMemo(
    () => [
      { name: "Abiertos", value: toCount(stats.openChats) },
      { name: "En progreso", value: toCount(stats.inProgressChats) },
      { name: "Resueltos", value: toCount(stats.resolvedChats) },
      { name: "Cerrados", value: toCount(stats.closedChats) },
    ],
    [stats]
  );

  const PIE_COLORS = ["#e4871cff", "#6954e2ff", "#00be7fff", "#b80202ff"];
  const total = chartData.reduce((acc, d) => acc + d.value, 0);
  const hasData = total > 0;

  // Etiquetas: sólo si ≥ 3% para evitar solapamiento
  const renderLabel = (d: any) => {
    if (!hasData || !d || d.value <= 0) return undefined;
    const pct = (d.value / total) * 100;
    if (pct < 3) return undefined;
    return `${d.name}: ${Math.round(pct)}%`;
    // TIP: si quieres ocultar el borde exterior del pastel por completo,
    // puedes envolver el <PieChart> en un contenedor con fondo igual al del card
    // y no usar stroke en <Pie>.
  };

  // Presets de rango
  const applyPreset = (type: "today" | "7d" | "month" | "all") => {
    const now = dayjs();
    if (type === "today") {
      setDateStart(now.startOf("day"));
      setDateEnd(now.endOf("day"));
    } else if (type === "7d") {
      setDateStart(now.subtract(6, "day").startOf("day"));
      setDateEnd(now.endOf("day"));
    } else if (type === "month") {
      setDateStart(now.startOf("month"));
      setDateEnd(now.endOf("month"));
    } else {
      setDateStart(null);
      setDateEnd(null);
    }
  };

  // Descargar PDF del dashboard
  const handleDownloadPDF = async () => {
    const input = document.getElementById("dashboard-report");
    if (!input) return;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("reporte-dashboard.pdf");
  };

  if (!token || !(user?.role === "Admin" || user?.role === "Solver")) {
    return (
      <>
        <Box sx={{ mt: 10, textAlign: "center" }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Bienvenido al sistema PQRSD
          </Typography>
          {!user && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Inicia sesión para acceder a las funcionalidades.
            </Typography>
          )}
        </Box>
        {!user && (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Por favor, inicia sesión para continuar.
          </Typography>
        )}
        {user && <MyPqr />}
      </>
    );
  }

  return (
    <Box sx={{ mt: 2 }} id="dashboard-report">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Bienvenido a la plataforma PQRSD
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleDownloadPDF}
          sx={{ ml: 2 }}
        >
          Descargar PDF
        </Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Aquí puedes gestionar tus solicitudes, ver el estado de tus chats y
        acceder a las funcionalidades según tu rol.
      </Typography>

      {/* Barra de filtros */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            background: "rgba(255,255,255,0.4)",
            boxShadow: "0 8px 32px 0 rgba(31,38,135,0.12)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
          elevation={0}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ flexWrap: "wrap" }}
            >
              <DatePicker
                label="Desde"
                value={dateStart}
                onChange={(newVal) => setDateStart(newVal)}
                slotProps={{ textField: { size: "small" } }}
              />
              <DatePicker
                label="Hasta"
                value={dateEnd}
                onChange={(newVal) => setDateEnd(newVal)}
                slotProps={{ textField: { size: "small" } }}
              />
              <Button
                onClick={() => {
                  setDateStart(null);
                  setDateEnd(null);
                }}
                variant="outlined"
                size="small"
              >
                Limpiar
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label="Hoy" onClick={() => applyPreset("today")} />
              <Chip label="Últimos 7 días" onClick={() => applyPreset("7d")} />
              <Chip label="Este mes" onClick={() => applyPreset("month")} />
              <Chip label="Todo" onClick={() => applyPreset("all")} />
            </Stack>
          </Stack>
        </Paper>
      </LocalizationProvider>

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
                  background: "transparent",
                }}
              >
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        formatter={(value) => (
                          <span style={{ fontWeight: "bold" }}>{value}</span>
                        )}
                      />
                      <ReTooltip
                        formatter={(value: any, name: any) => [
                          value,
                          name as string,
                        ]}
                      />

                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={95}
                        paddingAngle={3}
                        labelLine={false}
                        animationEasing="linear"
                        label={renderLabel}
                        isAnimationActive={true}
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

      <Box sx={{ height: 20 }} />
      <MyPqr />
    </Box>
  );
}
