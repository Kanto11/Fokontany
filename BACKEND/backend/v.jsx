import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

const MOIS_COURT = ["janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const ar = (n) => `${Number(n).toLocaleString("fr-FR")} Ar`;
const quand = (d) =>
  new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

function Compteur({ titre, valeur, lien, couleur, petit }) {
  return (
    <Link to={lien} className="stat bg-base-100 shadow rounded-lg hover:shadow-md">
      <div className="stat-title">{titre}</div>
      <div className={`stat-value text-3xl ${couleur || ""}`}>{valeur}</div>
      {petit && <div className="stat-desc">{petit}</div>}
    </Link>
  );
}

export default function AccueilResponsable() {
  const [d, setD] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api.get("/dashboard/responsable/")
      .then(({ data }) => setD(data))
      .catch(() => setErreur("Impossible de charger le tableau de bord."));
  }, []);

  if (erreur) return <p style={{ color: "red" }}>{erreur}</p>;
  if (!d) return <p>Chargement…</p>;

  const c = d.compteurs;
  const max = Math.max(...d.graphique.map((g) => g.total), 1);

  return (
    <div className="dashboard flex flex-col gap-6">
      {/* 1. compteurs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Compteur titre="Familles" valeur={c.familles} lien="/responsable/carnets" />
        <Compteur titre="Familles en retard" valeur={c.en_retard}
                  lien="/responsable/cotisations" couleur={c.en_retard ? "text-error" : ""} />
        <Compteur titre="Encaissé ce mois" valeur={ar(c.encaisse_mois)}
                  lien="/responsable/cotisations" couleur="text-success" />
        <Compteur titre="Résidences à traiter" valeur={c.residences_a_traiter}
                  lien="/responsable/residences"
                  petit={c.residences_a_payer ? `${c.residences_a_payer} à payer` : null} />
      </div>

      {/* 2. graphique */}
      <section className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="font-bold">Cotisations encaissées (6 derniers mois)</h3>
          <div className="flex gap-3 mt-2">
            {d.graphique.map((g) => (
              <div key={`${g.annee}-${g.mois}`} className="flex flex-col items-center flex-1">
                <span className="text-xs mb-1">{g.total ? ar(g.total) : "—"}</span>
                <div style={{ height: 120, display: "flex", alignItems: "flex-end", width: "100%" }}>
                  <div className="bg-primary rounded-t"
                       style={{ width: "100%", height: `${(g.total / max) * 100}%`, minHeight: 2 }} />
                </div>
                <span className="text-xs mt-1">{MOIS_COURT[g.mois - 1]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. listes */}
      <div className="grid lg:grid-cols-3 gap-4">
        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="font-bold">Familles les plus en retard</h3>
            {d.familles_en_retard.length === 0 ? (
              <p className="text-sm">Toutes les familles sont à jour.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {d.familles_en_retard.map((f) => (
                  <li key={f.carnet_id} className="flex justify-between text-sm">
                    <span>{f.chef}</span>
                    <span className="text-error">{f.nb_impayes} mois · {ar(f.montant_du)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/responsable/cotisations" className="link text-sm mt-2">Voir tout</Link>
          </div>
        </section>

        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="font-bold">Résidences à traiter</h3>
            {d.residences.length === 0 ? (
              <p className="text-sm">Aucune demande en attente.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {d.residences.map((r) => (
                  <li key={r.id} className="text-sm">
                    <div className="font-semibold">{r.personne}</div>
                    <div className="text-gray-500">
                      {r.blocages.length ? r.blocages.join(", ") : "Aucun blocage"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/responsable/residences" className="link text-sm mt-2">Voir tout</Link>
          </div>
        </section>

        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="font-bold">Dernières publications</h3>
            {d.publications.length === 0 ? (
              <p className="text-sm">Aucune publication.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {d.publications.map((p) => (
                  <li key={p.id} className="text-sm">
                    <div className="text-xs text-gray-500">{quand(p.date)}</div>
                    <div style={{ whiteSpace: "pre-line" }}>
                      {p.texte.length > 120 ? `${p.texte.slice(0, 120)}…` : p.texte}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}