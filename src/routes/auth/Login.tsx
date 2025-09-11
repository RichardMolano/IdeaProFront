import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { Button } from "../../ui/Form";
import { Mail, Lock } from "lucide-react"; // íconos

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/chat");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-center text-[#1e2b39] mb-6">
          Bienvenido a <span className="text-[#f39200]">IdeaPro</span>
        </h1>

        <form onSubmit={submit} className="space-y-4">
          {/* Input con ícono email */}
          <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#f39200]">
            <Mail className="text-gray-400 w-5 h-5 mr-2" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full outline-none text-gray-700"
            />
          </div>

          {/* Input con ícono password */}
          <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#f39200]">
            <Lock className="text-gray-400 w-5 h-5 mr-2" />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full outline-none text-gray-700"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center font-medium">
              Ingreso Invalido Intente nuevamente
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[#f39200] hover:bg-[#d97f00] text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            Ingresar
          </Button>
        </form>

        <div className="mt-4 text-sm text-center">
          <span className="text-gray-600">¿No tienes cuenta?</span>{" "}
          <Link
            to="/register"
            className="font-semibold text-[#f39200] hover:underline"
          >
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}
