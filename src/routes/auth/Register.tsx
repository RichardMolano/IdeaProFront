import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { Button } from "../../ui/Form";
import { Mail, Lock } from "lucide-react"; // Usamos la misma librería que en Login

export default function Register() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password);
      navigate("/chat");
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta");
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-auto box-border">
        {/* Título */}
        <div className="text-center mb-3">
          <h1 className="text-3xl font-extrabold text-[#1e2b39] mt-0 mb-2">
            Crear cuenta en <span className="text-[#f39200]">IdeaPro</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Regístrate para acceder al sistema
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={submit} className="space-y-4">
          {/* Input correo con ícono */}
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

          {/* Input contraseña con ícono */}
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
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[#f39200] hover:bg-[#d97f00] text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            Crear cuenta
          </Button>
        </form>

        {/* Link al login */}
        <div className="mt-4 text-sm text-center">
          <span className="text-gray-600">¿Ya tienes cuenta?</span>{" "}
          <Link
            to="/login"
            className="font-semibold text-[#f39200] hover:underline"
          >
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
