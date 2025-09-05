import { PqrAPI } from "../../api/client";
import { useEffect, useState } from "react";

type Pqr = {
  id: string;
  title: string;
  status: string;
  created_at: Date | string | null;
  chat_group?: { id: string };
};

export default function MyPqr() {
  const [data, setData] = useState<Pqr[]>([]);
  useEffect(() => {
    PqrAPI.mine().then(setData);
  }, []);
  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Mis PQR</h1>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.id} className="p-3 border rounded">
            <div className="font-medium">{d.title}</div>
            <div className="text-sm text-gray-600">
              Fecha de creación:{" "}
              {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
            </div>
            <div className="text-sm text-gray-600">Estado: {d.status}</div>
            <div className="text-sm text-gray-600">
              ChatGroup: {d.chat_group?.id || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
