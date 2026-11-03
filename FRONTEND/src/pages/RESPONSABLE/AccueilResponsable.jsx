import { useEffect, useState } from "react";
import api from "../../api";

export default function AccueilResponsable() {
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/cotisations/impayes/"),
      api.get("/messages/recus/?lu=false"),
    ])
      .then(([impayes, messages]) =>
        setStats({
          impayes: impayes.data.nombre,
          messages: messages.data.length,
        })
      )
      .catch(() => setErreur("Impossible de charger le tableau de bord.")); 
   
  }, []);

  return (
    <>
      {erreur && <p className="alerte alerte--erreur">{erreur}</p>}
      {stats && (
        <div className="stats">
          <div className="stats__carte"><strong>{stats.impayes}</strong> impayés ce mois</div>
          {/* <div className="stats__carte"><strong>{stats.residences}</strong> demandes de résidence</div> */}
          <div className="stats__carte"><strong>{stats.messages}</strong> messages non lus</div>
          <p>En cours de chargement...</p>
        </div>
      )}
    </>
  );
}