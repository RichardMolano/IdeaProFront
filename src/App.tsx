import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import AssignPage from "./routes/admin/AssignPage";
import Dashboard from "./routes/app/Dashboard";
import Login from "./routes/auth/Login";
import Register from "./routes/auth/Register";
import ChatPage from "./routes/chat/ChatPage";
import UserAdmin from "./routes/userAdmin/UserAdmin";
import DependenceAdminPage from "./routes/dependence/DependenceAdminPage";

import MyPqr from "./routes/pqr/MyPqr";
import NewPqr from "./routes/pqr/NewPqr";
import { AuthProvider, useAuth } from "./store/auth";
import DashboardHome from "./routes/app/DashboardHome";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Avatar,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ChatIcon from "@mui/icons-material/Chat";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutRounded from "@mui/icons-material/LogoutRounded";

/** Protege rutas que requieren sesión */
function Protected({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

/** Protege rutas que requieren sesión + rol permitido */
function ProtectedRole({
  children,
  allowed,
}: {
  children: JSX.Element;
  allowed: Array<string>;
}) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  const ok = user && allowed.includes(String(user.role));
  if (!ok) return <Navigate to="/" replace />;
  return children;
}

/** Barra superior mínima, dentro de un pill semitransparente */
function UserBar() {
  const { token, user, logout } = useAuth();
  if (!token) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        backdropFilter: "blur(10px)",
        background: "rgba(255,255,255,0.75)",
        border: "1px solid rgba(255,255,255,0.45)",
        boxShadow: "0 8px 24px rgba(31,38,135,0.18)",
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontWeight: 700,
          color: "#fff",
          background: "linear-gradient(135deg, #FFD700 0%, #FFF176 100%)",
        }}
      >
        {(user?.email || "U")[0].toUpperCase()}
      </Avatar>
      <Typography
        variant="body2"
        sx={{ color: "text.primary", fontWeight: 500 }}
      >
        {user?.email}
      </Typography>
      <Tooltip title="Cerrar sesión">
        <IconButton onClick={logout} size="small">
          <LogoutRounded />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}

function Nav() {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [value, setValue] = useState(location.pathname);
  const isSm = useMediaQuery("(max-width:600px)");

  useEffect(() => setValue(location.pathname), [location.pathname]);

  const actions = useMemo(
    () =>
      [
        { label: "Inicio", icon: <HomeIcon />, to: "/", visible: true },
        { label: "Chat", icon: <ChatIcon />, to: "/chat", visible: !!token },
        {
          label: "Nuevo PQR",
          icon: <AddCircleIcon />,
          to: "/pqr/new",
          visible: !!token,
        },

        {
          label: "Asignaciones",
          icon: <AdminPanelSettingsIcon />,
          to: "/admin/assign",
          visible:
            !!token && (user?.role === "Admin" || user?.role === "Supervisor"),
        },
        {
          label: "Usuarios",
          icon: <AdminPanelSettingsIcon />,
          to: "/admin/user",
          visible:
            !!token && (user?.role === "Admin" || user?.role === "Supervisor"),
        },
        {
          label: "Dependencias",
          icon: <AssignmentIcon />,
          to: "/admin/dependence",
          visible:
            !!token && (user?.role === "Admin" || user?.role === "Supervisor"),
        },
        !token
          ? {
              label: "Login",
              icon: <PersonIcon />,
              to: "/login",
              visible: true,
            }
          : null,
      ].filter(Boolean) as Array<{
        label: string;
        icon: JSX.Element;
        to: string;
        visible: boolean;
      }>,
    [token, user]
  );

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: { xs: "4.5vh", sm: "5vh" },
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          borderRadius: 999,
          px: { xs: 1, sm: 2 },
          py: 0.5,
          boxShadow: "0 10px 40px rgba(31,38,135,.18)",
          backdropFilter: "blur(10px)",
          background: "rgba(255,255,255,.75)",
          minWidth: isSm ? 320 : 520,
          maxWidth: 640,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "1px solid rgba(255,255,255,.4)",
        }}
      >
        <BottomNavigation
          showLabels
          value={value}
          onChange={(_, v) => {
            setValue(v);
            const a = actions.find((x) => x.to === v);
            if (a) navigate(a.to);
          }}
          sx={{
            background: "transparent",
            width: "100%",
            "& .MuiBottomNavigationAction-root": {
              position: "relative",
              isolation: "isolate",
              borderRadius: 999,
              minWidth: { xs: 64, sm: 80 },
              mx: { xs: 0.25, sm: 0.75 },
              color: "text.primary",
              backgroundColor: "transparent",
            },
            "& .MuiBottomNavigationAction-root.Mui-selected::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              background: "linear-gradient(135deg, #FFD700 0%, #FFF176 100%)",
              zIndex: -1,
            },
            "& .MuiBottomNavigationAction-root.Mui-selected .MuiBottomNavigationAction-label":
              {
                color: "#30008A !important",
              },
            "& .MuiBottomNavigationAction-root.Mui-selected .MuiSvgIcon-root": {
              color: "#30008A !important",
            },
          }}
        >
          {actions.map((a) =>
            a.visible ? (
              <BottomNavigationAction
                key={a.label}
                label={a.label}
                icon={a.icon}
                component={Link}
                to={a.to}
                value={a.to}
                title={a.label}
                sx={{ px: { xs: 0.5, sm: 1 } }}
              />
            ) : null
          )}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          position: "relative",
          overflowX: "hidden",
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(127,127,213,0.35) 0%, rgba(127,127,213,0) 60%), radial-gradient(1200px 600px at 90% 110%, rgba(145,234,228,0.35) 0%, rgba(145,234,228,0) 60%), linear-gradient(180deg, #e9f1ff 0%, #f7fbff 60%)",
        }}
      >
        {/* Patrón sutil */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,26,42,0.05) 1px, transparent 0)",
            backgroundSize: "24px 24px",
            pointerEvents: "none",
          }}
        />

        <UserBar />

        {/* Contenido transparente */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 1100,
            mx: "auto",
            px: { xs: 2, sm: 3 },
            pt: { xs: "96px", sm: "108px" }, // espacio para user bar
            pb: { xs: "22vh", sm: "18vh" }, // espacio nav inferior
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box sx={{ width: "100%" }}>
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rutas protegidas por sesión */}
              <Route
                path="/app"
                element={
                  <Protected>
                    <Dashboard />
                  </Protected>
                }
              />
              <Route
                path="/chat"
                element={
                  <Protected>
                    <ChatPage />
                  </Protected>
                }
              />
              <Route
                path="/pqr/new"
                element={
                  <Protected>
                    <NewPqr />
                  </Protected>
                }
              />
              <Route
                path="/pqr/mine"
                element={
                  <Protected>
                    <MyPqr />
                  </Protected>
                }
              />

              {/* Ruta de admin/supervisor: sesión + rol */}
              <Route
                path="/admin/assign"
                element={
                  <ProtectedRole allowed={["Admin", "Supervisor"]}>
                    <AssignPage />
                  </ProtectedRole>
                }
              />
              <Route
                path="/admin/user"
                element={
                  <ProtectedRole allowed={["Admin", "Supervisor"]}>
                    <UserAdmin />
                  </ProtectedRole>
                }
              />
              <Route
                path="/admin/dependence"
                element={
                  <ProtectedRole allowed={["Admin", "Supervisor"]}>
                    <DependenceAdminPage />
                  </ProtectedRole>
                }
              />
            </Routes>
          </Box>
        </Box>

        <Nav />
      </div>
    </AuthProvider>
  );
}
