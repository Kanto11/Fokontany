import { useEffect, useState } from "react";
import api from "../../api";

const quand = (d) =>
  new Date(d).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });

export default function PublicationsHabitant() {
  const [publications, setPublications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    setChargement(true);
    api.get("/publications/habitant/", { params: { page } })
      .then(({ data }) => {
        setPublications(data.resultats);
        setPagination(data.pagination);
        setPage(data.pagination.page);
        setErreur("");
      })
      .catch(() => setErreur("Impossible de charger les publications."))
      .finally(() => setChargement(false));
  }, [page]);

  return (
    <div className="publications">
      <h3 className="font-bold text-lg mb-4">Publications du quartier</h3>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      {chargement ? (
        <p>Chargement…</p>
      ) : publications.length === 0 ? (
        <p>Aucune publication pour le moment.</p>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {publications.map((p) => (
              <article key={p.id} className="card bg-base-100 shadow">
                <div className="card-body">
                  <p className="text-sm text-gray-500">{quand(p.date)}</p>
                  <p style={{ whiteSpace: "pre-line" }}>{p.texte}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm">{pagination.total} publication(s)</span>
            <div className="join">
              <button className="join-item btn btn-sm" disabled={page === 1} onClick={() => setPage(1)}>«</button>
              <button className="join-item btn btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
              <span className="join-item btn btn-sm no-animation">Page {pagination.page} / {pagination.pages}</span>
              <button className="join-item btn btn-sm" disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>›</button>
              <button className="join-item btn btn-sm" disabled={page === pagination.pages} onClick={() => setPage(pagination.pages)}>»</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}