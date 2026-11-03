import { useEffect, useRef, useState } from "react";
import api from "../../api";
import refresh from "../../assets/Icons/refresh-arrow.png";
import CarnetDialog from "./CarnetDialog";

import debut from "../../assets/Icons/debut.png";
import fin from "../../assets/Icons/fin.png";
import precedent from "../../assets/Icons/gauche_fleche.png";
import suivant from "../../assets/Icons/droite_fleche.png";

export default function HabitantsResponsable() {
  const [carnets, setCarnets] = useState([]);
  const [secteurs, setSecteurs] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [logements ,setLogements] = useState([]);
  const [nationalites , setNationalites] = useState([]);
  const [page,setPage] = useState(1)
  const [totalPage , setTotalPage] = useState(1)

  const [recherche, setRecherche] = useState("");
  const [secteur, setSecteur] = useState("");
  const [profession, setProfession] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [carnetSelectionne, setCarnetSelectionne]= useState(null)
  const modalVoir = useRef(null);
  const [dialogOuvert, setDialogOuvert] = useState(false);


  useEffect(() => {
    api.get("/secteurs/").then(({ data }) => setSecteurs(data)).catch(() => {});
    api.get("/professions/").then(({ data }) => setProfessions(data)).catch(() => {});
    api.get("/nationalites/").then(({data}) => setNationalites(data)).catch(() => {});
    api.get( "/logements").then(({data}) => setLogements(data)).catch(() => {});
    
  }, []);

 
  useEffect(() => {
    const minuteur = setTimeout(() => { 
      setChargement(true);
      setErreur("");
      api.get("/carnets/", { params: { q: recherche, secteur, profession ,page} })
        .then(({ data }) => {setCarnets(data.results);
                              setTotalPage(data.total_pages)
        })
        .catch(() => setErreur("Impossible de charger les carnets."))
        .finally(() => setChargement(false));
    }, 300);
    return () => clearTimeout(minuteur);
  }, [recherche, secteur, profession,page]);

  useEffect(()=>{
    setPage(1);
    },[recherche,secteur,profession])
    
    function réinitialiserFiltres(){
      setRecherche("");
      setSecteur("");
      setProfession("");
  }


async function ouvrirDétailsCarnet(carnet) {
    try {
        const response = await api.get(`/carnets/${carnet.id}/`);
        console.log("Enfants reçus :", response.data.enfants);
        setCarnetSelectionne(response.data);
        modalVoir.current.showModal();
    } catch (error) {
        console.error(
            "Erreur lors du chargement du carnet :",
            error
        );
    }
}
  return (
    <div className="habitant_resp">
      <div className="habitant_resp_container">
        <div className="habitant__resp__header">
         
          
          <div className="habitant__resp__search">
            <div className="search_text">
                <input id="refresh" type="text" placeholder="Recherche par nom, numéro de carnet" value={recherche} onChange={(e) => setRecherche(e.target.value)}/>
                <button onClick={réinitialiserFiltres}><img src={refresh} alt="" /></button>
            </div>
            
            <div className="habitant__resp__search__filtre">
              <div className="habitant__filtre__select">
                <label>Secteur :</label>
                <select value={secteur} onChange={(e) => setSecteur(e.target.value)}>
                  <option value="">Tous</option>
                  {secteurs.map((s) => (
                    <option key={s.id} value={s.id}>{s.nom_S || `Secteur ${s.id}`}</option>
                  ))}
                </select>
              </div>
              <div className="habitant__filtre__select">
                <label>Emploi :</label>
                <select value={profession} onChange={(e) => setProfession(e.target.value)}>
                  <option value="">Tous</option>
                  {professions.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom_Prof}</option>
                  ))}
                </select>
                
              </div>

              <div className="nouveu__habitant">
                <CarnetDialog 
                  logements = {logements}
                  professions ={professions}
                  nationalites = {nationalites}
                  onCreated={(nouveauCarnet)=>{
                    setCarnets([nouveauCarnet,...carnets]);
                  }}
                />
              </div>

            </div>
          </div>
        </div>

        <div className="habitant__resp__body">
          <div className="habitant__resp__left">
            {erreur && <p className="alerte alerte--erreur">{erreur}</p>}
            <table>
              <thead>
                <tr>
                  <th>N° Carnet</th>
                  <th>Nom chef famille</th>
                  <th>Adresse</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {chargement && (
                  <tr><td colSpan="6">Chargement...</td></tr>
                )}
                {!chargement && carnets.length === 0 && !erreur && (
                  <tr><td colSpan="6">Aucun carnet trouvé.</td></tr>
                )}
                {!chargement && carnets.map((c) => (
                  <tr key={c.id}>
                    <td>N° {c.id}</td>
                    <td>{c.chef || "—"}</td>
                    <td>{c.adresse}</td>
                    <td>{c.telephone || "—"}</td>
                    <td>
                      <span className={`badge ${c.statut === "ACTIF" ? "badge-success" : "badge-ghost"}`}>
                        {c.statut === "ACTIF" ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm" onClick={() => ouvrirDétailsCarnet(c)}>Voir</button>
                      <button className="btn btn-sm">Modifier</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
          </div>
          
        {/* <div className="habitant__resp__right">
                <CarnetDialog 
                  logements = {logements}
                  professions ={professions}
                  nationalites = {nationalites}
                  onCreated={(nouveauCarnet)=>{
                    setCarnets([nouveauCarnet,...carnets]);
                  }}
                />
         </div> */}
        <div className="res__resp__footer pagination__parent">
                          
            <div className="pagination__action">
              <button disabled={page === 1} onClick={() => setPage(1)}>
                <img src={debut} className="pagination_img"/>
              </button>
              <button disabled={page <= 1} onClick={() => setPage(prev => prev-1)}>
                <img src={precedent} className="pagination_img2"/>
              </button>
              <span>Page {page} / {totalPage}</span>
              <button disabled={page >= totalPage} onClick={() => setPage(prev => prev+1)}>
                <img src={suivant} className="pagination_img2"/>
              </button>
              <button disabled={page === totalPage} onClick={() => setPage(totalPage)}>
                <img src={fin} className="pagination_img"/>
              </button>
            </div>
            
            
        </div>
        </div>
      </div>


      <dialog ref={modalVoir}>        
                <div className="details-carnet">

                  <h3>Informations du carnet</h3>

                  <p><strong>Numéro :</strong> {carnetSelectionne?.id}</p>
                  <p><strong>Adresse :</strong> {carnetSelectionne?.adresse}</p>
                  <p><strong>Téléphone :</strong> {carnetSelectionne?.telephone || "Non renseigné"}</p>
                  <p><strong>Secteur :</strong> {carnetSelectionne?.secteur}</p>
                  <p><strong>Statut :</strong> {carnetSelectionne?.statut}</p>

                  <hr />

                  <h3>Informations du père</h3>

                  {carnetSelectionne?.pere ? (
                    <div>
                      <p><strong>Nom :</strong> {carnetSelectionne.pere.nom_P}</p>
                      <p><strong>Prénom :</strong> {carnetSelectionne.pere.prenom_P}</p>
                      <p>
                        <strong>Nationalité :</strong>{" "}
                        {carnetSelectionne?.pere?.nationalite?.nationalite || "Non renseignée"}
                      </p>

                      <h4>Pièce d'identité</h4>
                      {carnetSelectionne.pere.piece ? (
                        <>
                          <p><strong>Type :</strong> {carnetSelectionne.pere.piece.type_piece}</p>
                          <p><strong>Numéro :</strong> {carnetSelectionne.pere.piece.numero}</p>
                          <p><strong>Date de délivrance :</strong> {carnetSelectionne.pere.piece.date_delivrance}</p>
                          <p><strong>Lieu de délivrance :</strong> {carnetSelectionne.pere.piece.lieu_delivrance}</p>
                          <p><strong>Date d'expiration :</strong> {carnetSelectionne.pere.piece.date_expiration}</p>
                        </>
                      ) : (
                        <p>Aucune pièce d'identité renseignée.</p>
                      )}
                    </div>
                  ) : (
                    <p>Aucun père renseigné.</p>
                  )}

                  <hr />

                  <h3>Informations de la mère</h3>

                  {carnetSelectionne?.mere ? (
                    <div>
                      <p><strong>Nom :</strong> {carnetSelectionne.mere.nom_P}</p>
                      <p><strong>Prénom :</strong> {carnetSelectionne.mere.prenom_P}</p>
                      <p>
                          <strong>Nationalité :</strong>{" "}
                          {carnetSelectionne?.mere?.nationalite?.nationalite || "Non renseignée"}
                        </p>

                      <h4>Pièce d'identité</h4>
                      {carnetSelectionne.mere.piece ? (
                        <>
                          <p><strong>Type :</strong> {carnetSelectionne.mere.piece.type_piece}</p>
                          <p><strong>Numéro :</strong> {carnetSelectionne.mere.piece.numero}</p>
                          <p><strong>Date de délivrance :</strong> {carnetSelectionne.mere.piece.date_delivrance}</p>
                          <p><strong>Lieu de délivrance :</strong> {carnetSelectionne.mere.piece.lieu_delivrance}</p>
                          <p><strong>Date d'expiration :</strong> {carnetSelectionne.mere.piece.date_expiration}</p>
                        </>
                      ) : (
                        <p>Aucune pièce d'identité renseignée.</p>
                      )}
                    </div>
                  ) : (
                    <p>Aucune mère renseignée.</p>
                  )}

                  <hr />

                  <h3>
                    Enfants ({carnetSelectionne?.enfants?.length || 0})
                  </h3>

                  {carnetSelectionne?.enfants?.length > 0 ? (
                    carnetSelectionne.enfants.map((enfant, index) => (
                      <div className="enfant-card" key={enfant.id || index}>
                        <h4>Enfant {index + 1}</h4>

                        <p><strong>Nom :</strong> {enfant.nom_Ef}</p>
                        <p><strong>Prénom :</strong> {enfant.prenom_Ef}</p>
                        <p><strong>Date de naissance :</strong> {enfant.date_nais_Ef}</p>
                        <p><strong>Lieu de naissance :</strong> {enfant.lieu_nais_Ef}</p>
                        <p>
                          <strong>Nationalité :</strong>{" "}
                          {enfant.nationalite?.nationalite || "Non renseignée"}
                        </p>
                        <p>
                          <strong>Profession :</strong>{" "}
                          {typeof enfant.profession === "object"
                            ? enfant.profession?.profession
                            : enfant.profession || "Non renseignée"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p>Aucun enfant enregistré pour ce carnet.</p>
                  )}

                </div>

               <form method="dialog" className="modal-backdrop">
                  <button>Fermer</button>
               </form>
      </dialog>

    </div>
  );
}