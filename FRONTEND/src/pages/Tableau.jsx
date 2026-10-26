import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Tableau() {
  const [moi, setMoi] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/moi/")
      .then(({ data }) => setMoi(data))
      .catch(() => {
        localStorage.clear();
        navigate("/connexion");
      });
  }, [navigate]);

  if (!moi) return <p>Chargement...</p>;

  return (
    <>
      <h1>Bienvenue</h1>
      <p>Connecté : {moi.email} ({moi.type})</p>
    </>
  );
}