import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { Button, Input } from "../../ui/Form";

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
      setError(err.message || "Error");
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Registro</h1>
      <form onSubmit={submit} className="space-y-3">
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Button type="submit" className="text-white">
          Crear cuenta
        </Button>
      </form>
      <div className="mt-3 text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="underline">
          Entrar
        </Link>
      </div>
    </div>
  );
}
