import { Routes, Route, Navigate, Link } from "react-router-dom";
import AssignPage from "./routes/admin/AssignPage";
import Dashboard from "./routes/app/Dashboard";
import Login from "./routes/auth/Login";
import Register from "./routes/auth/Register";
import ChatPage from "./routes/chat/ChatPage";
import MyPqr from "./routes/pqr/MyPqr";
import NewPqr from "./routes/pqr/NewPqr";
import { AuthProvider, useAuth } from "./store/auth";

function Protected({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Nav() {
  const { token, user, logout } = useAuth();
  return (
    <nav className="p-3 bg-white shadow flex gap-3 items-center">
      <Link to="/" className="font-semibold">
        PQRSD
      </Link>
      {token && (
        <>
          <Link to="/pqr/new">Nuevo PQR</Link>
          <Link to="/pqr/mine">Mis PQR</Link>
          <Link to="/chat">Chat</Link>
          {(user?.role === "Admin" || user?.role === "Supervisor") && (
            <Link to="/admin/assign">Asignaciones</Link>
          )}
        </>
      )}
      <div className="flex-1" />
      {token ? (
        <button onClick={logout} className="text-sm underline">
          Salir
        </button>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Registro</Link>
        </>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <div className="p-4 max-w-4xl mx-auto">
        <Routes>
          <Route path="/" element={<div className="text-lg">Bienvenido</div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
          <Route
            path="/admin/assign"
            element={
              <Protected>
                <AssignPage />
              </Protected>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}
