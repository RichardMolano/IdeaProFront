const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
// Modelo de Dependence
export type Dependence = {
  id: string;
  name: string;
  users?: Array<{ id: string; name: string; email: string }>;
  pqrs?: Array<any>;
};

// DTOs para crear/actualizar
export type CreateDependenceDto = {
  name: string;
};
export type UpdateDependenceDto = {
  name?: string;
};

export const DependenceAPI = {
  // Listar todas las dependencias
  list: async (): Promise<Dependence[]> => {
    return api("/dependence", { method: "GET" });
  },
  // Obtener una dependencia por ID
  get: async (id: string): Promise<Dependence> => {
    return api(`/dependence/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  },
  // Crear dependencia
  create: async (dto: CreateDependenceDto): Promise<Dependence> => {
    return api("/dependence", {
      method: "POST",
      body: JSON.stringify(dto),
      headers: { "Content-Type": "application/json" },
    });
  },
  // Actualizar dependencia
  update: async (id: string, dto: UpdateDependenceDto): Promise<Dependence> => {
    return api(`/dependence/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(dto),
      headers: { "Content-Type": "application/json" },
    });
  },
  // Eliminar dependencia
  delete: async (id: string): Promise<void> => {
    await api(`/dependence/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};

// Define or import the User type
type User = {
  id: string;
  name: string;
  email: string;
  // Add other fields as needed
};

export async function api(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json();
}

export const AuthAPI = {
  login: (email: string, password: string) =>
    api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => api("/users/me"),
};

export const PqrAPI = {
  create: (
    title: string,
    description: string,
    priority: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM",
    dependence: string
  ) =>
    api("/pqr", {
      method: "POST",
      body: JSON.stringify({ title, description, priority, dependence }),
    }),
  mine: () => api("/pqr/mine"),
};

export const ChatAPI = {
  // Retorna los grupos de chat con información extendida de PQR y solver asignado
  groupsWithDetails: () => api("/chat/groups-with-details"),
  groups: () => api("/chat/groups"),
  messages: (groupId: string) =>
    api(`/chat/messages?groupId=${encodeURIComponent(groupId)}`),
  send: (
    userId: string,
    groupId: string,
    content: string,
    file_url?: string,
    file_type?: string
  ) =>
    api("/chat/message", {
      method: "POST",
      body: JSON.stringify({
        userId,
        groupId,
        content,
        file_url,
        file_type,
      }),
    }),
  setGroupStatus: (
    chat_group_id: string,
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  ) =>
    api("/chat/set-group-status", {
      method: "POST",
      body: JSON.stringify({ chat_group_id, status }),
    }),
};

export const AssignAPI = {
  solvers: () => api("/assignments/solvers"),
  assign: (chat_group_id: string, solver_user_id: string) =>
    api("/assignments/assign", {
      method: "POST",
      body: JSON.stringify({ chat_group_id, solver_user_id }),
    }),
  unassign: (chat_group_id: string, solver_user_id: string) =>
    api(
      `/assignments/unassign/${encodeURIComponent(
        chat_group_id
      )}/${encodeURIComponent(solver_user_id)}`,
      { method: "POST" }
    ),
};

// src/api/client.ts (o donde tengas el AdminAPI)
export const AdminAPI = {
  // GET /users  -> normaliza role a string
  users: async () => {
    const rows = await api("/users");
    return (rows || []).map((u: any) => ({
      id: u.id,
      email: u.email ?? "",
      role: u.role ?? "", // <- lo que tu UI espera (string)
      roleId: u.role?.id ?? null, // opcional por si luego quieres usar IDs
      dependence: u.dependence ?? null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  },

  // POST /users
  createUser: (
    email: string,
    password: string,
    role: string,
    dependenceId?: string
  ) =>
    api("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role, dependenceId }),
    }),

  // PUT /users/:id
  updateUser: (
    userId: string,
    email?: string,
    role?: string,
    password?: string,
    dependenceId?: string
  ) =>
    api(`/users/${encodeURIComponent(userId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role, password, dependenceId }),
    }),

  // DELETE /users/:id
  deleteUser: (userId: string) =>
    api(`/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    }),
};

// user info
export const UserAPI = {
  getUserInfoFromToken: () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        email: payload.email,
        role: payload.role,
        id: payload.sub,
      };
    } catch (error) {
      throw new Error("Invalid token");
    }
  },
};

// imagenes http://localhost:3001
export const ImageAPI = {
  upload: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`http://localhost:3001/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return await response.text(); // Returns the uploaded image URL
  },

  getRawImageUrl: (fileName: string): string => {
    return `${fileName}`;
  },
};
