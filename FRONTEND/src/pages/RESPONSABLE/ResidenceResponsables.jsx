import { useEffect, useRef, useState } from "react";
import api from "../../api"

import debut from "../../assets/Icons/debut.png";
import fin from "../../assets/Icons/fin.png";
import precedent from "../../assets/Icons/gauche_fleche.png";
import suivant from "../../assets/Icons/droite_fleche.png";
import ajouter from "../../assets/Icons/plus.png";
const ONGLETS = [
  { cle: "EN_ATTENTE", titre: "À traiter" },
  { cle: "A_PAYER", titre: "À payer" },
  { cle: "VALIDE", titre: "Validées" },
  { cle: "REFUSE", titre: "Refusées" },
  { cle: "REVOQUEE", titre: "Révoquées" },
  { cle: "tous", titre: "Tous" },
];

const date = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

function messageErreur(err) {
  const d = err.response?.data;
  if (!d) return "Le serveur ne répond pas.";
  if (typeof d.detail === "string") return d.detail;
  if (Array.isArray(d.detail)) return d.detail.join(" ");
  return Object.entries(d)
    .map(([champ, v]) => `${champ} : ${[].concat(v).join(" ")}`)
    .join(" · ");
}

function badge(r) {
  if (r.revoquee) return <span className="badge badge-error">Révoquée</span>;
  if (r.status === "VALIDE")
    return <span className="badge badge-success">Validée{r.validation_auto ? " (auto)" : ""}</span>;
  if (r.status === "EN_ATTENTE") return <span className="badge badge-warning">À traiter</span>;
  if (r.status === "A_PAYER") return <span className="badge badge-info">À payer</span>;
  return <span className="badge badge-error">Refusée</span>;
}

function details(r) {
  if (r.revoquee || r.status === "REFUSE") return r.motif_refus;
  if (r.status === "VALIDE") return `Valable jusqu au ${date(r.valable_jusqu_au)}`;
  if (r.status === "EN_ATTENTE")
    return r.blocages.length ? r.blocages.join(", ") : "Aucun blocage";
  return "En attente du paiement";
}

export default function ResidenceResponsable() {
  // ---------- liste ----------
  const [statut, setStatut] = useState("EN_ATTENTE");
  const [recherche, setRecherche] = useState("");
  const [page, setPage] = useState(1);
  const [donnees, setDonnees] = useState({
    compteurs: {}, resultats: [], pagination: { page: 1, pages: 1, total: 0 },
  });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setChargement(true);
    const t = setTimeout(() => {
      api.get("/residences/responsable/", { params: { statut, q: recherche, page } })
        .then(({ data }) => {
          setDonnees(data);
          setPage(data.pagination.page);
          setErreur("");
        })
        .catch(() => setErreur("Impossible de charger les résidences."))
        .finally(() => setChargement(false));
    }, recherche ? 300 : 0);
    return () => clearTimeout(t);
  }, [statut, recherche, page, version]);

  // ---------- nouvelle demande au bureau ----------
  const modalBureau = useRef(null);
  const [rechercheCarnet, setRechercheCarnet] = useState("");
  const [carnetsTrouves, setCarnetsTrouves] = useState([]);
  const [carnet, setCarnet] = useState(null);
  const [personnes, setPersonnes] = useState({ parents: [], enfants: [] });
  const [demandeur, setDemandeur] = useState("");
  const [concerne, setConcerne] = useState("");     
  const [motif, setMotif] = useState("");
  const [paye, setPaye] = useState(true);
  const [reference, setReference] = useState("");
  const [envoiBureau, setEnvoiBureau] = useState(false);
  const [erreurBureau, setErreurBureau] = useState("");

  useEffect(() => {
    if (carnet || rechercheCarnet.trim().length < 2) {
      setCarnetsTrouves([]);
      return;
    }
    const t = setTimeout(() => {
      api.get("/carnets/", { params: { q: rechercheCarnet } })
        .then(({ data }) => {
          const liste = Array.isArray(data) ? data : data.results || [];
          setCarnetsTrouves(liste.slice(0, 4));
        })
        .catch(() => setCarnetsTrouves([]));
    }, 300);
    return () => clearTimeout(t);
  }, [rechercheCarnet, carnet]);

  function ouvrirBureau() {
    setRechercheCarnet(""); setCarnet(null); setPersonnes({ parents: [], enfants: [] });
    setDemandeur(""); setConcerne(""); setMotif(""); setPaye(true); setReference("");
    setErreurBureau("");
    modalBureau.current.showModal();
  }
  
  async function choisirCarnet(c) {
    setCarnet(c);
    setCarnetsTrouves([]);
    try {
      const { data } = await api.get(`/carnets/${c.id}/personnes/`);
      setPersonnes(data);
      setDemandeur(data.parents[0]?.id ?? "");
      setConcerne("");
    } catch (err) {
      setErreurBureau(messageErreur(err));
    }
  }

  async function envoyerBureau() {
    if (!carnet || !demandeur || !concerne || !motif.trim()) {
      setErreurBureau("Choisis la famille, le demandeur, la personne concernée et saisis le motif.");
      return;
    }
    setEnvoiBureau(true);
    setErreurBureau("");
    const [type, id] = concerne.split("-");
    try {
      const { data } = await api.post("/residences/bureau/", {
        carnet: carnet.id,
        demandeur: Number(demandeur),
        motif,
        paye,
        reference,
        ...(type === "p" ? { parent_concerne: Number(id) } : { enfant_concerne: Number(id) }),
      });
      modalBureau.current.close();
      setMessage(
        data.status === "VALIDE"
          ? "Certificat validé automatiquement."
          : data.status === "EN_ATTENTE"
          ? `Demande enregistrée, à traiter : ${data.blocages.join(", ") || "décision du responsable"}.`
          : "Demande enregistrée, en attente de paiement."
      );
      setVersion((v) => v + 1);
    } catch (err) {
      setErreurBureau(messageErreur(err));
    } finally {
      setEnvoiBureau(false);
    }
  }

  // ---------- décision : valider / refuser / révoquer / encaisser ----------
  const modalDecision = useRef(null);
  const [decision, setDecision] = useState(null);  
  const [motifDecision, setMotifDecision] = useState("");
  const [envoiDecision, setEnvoiDecision] = useState(false);
  const [erreurDecision, setErreurDecision] = useState("");

  function ouvrirDecision(residence, action) {
    setDecision({ residence, action });
    setMotifDecision("");
    setErreurDecision("");
    modalDecision.current.showModal();
  }

  async function confirmerDecision() {
    const { residence, action } = decision;
    if ((action === "refuser" || action === "revoquer") && !motifDecision.trim()) {
      setErreurDecision("Le motif est obligatoire.");
      return;
    }
    setEnvoiDecision(true);
    setErreurDecision("");
    try {
      if (action === "encaisser") {
        await api.post(`/residences/${residence.id}/encaisser/`, {});
      } else {
        await api.post(`/residences/${residence.id}/traiter/`, { action, motif: motifDecision });
      }
      modalDecision.current.close();
      setMessage("Opération enregistrée.");
      setVersion((v) => v + 1);
    } catch (err) {
      setErreurDecision(messageErreur(err));
    } finally {
      setEnvoiDecision(false);
    }
  }

  async function telechargerCertificat(id) {
  try {
    const { data } = await api.get(`/residences/${id}/pdf/`, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificat_residence_${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    // avec "blob", le message d'erreur arrive aussi dans un blob : on le relit
    try {
      const texte = await err.response.data.text();
      setErreur(JSON.parse(texte).detail || "Impossible de générer le PDF.");
    } catch {
      setErreur("Impossible de générer le PDF.");
    }
  }
}

  const TITRES = {
    valider: "Valider cette résidence ?",
    refuser: "Refuser cette demande",
    revoquer: "Révoquer ce certificat",
    encaisser: "Encaisser la résidence en espèces ?",
  };

  const { compteurs, resultats, pagination } = donnees;

    return(
        <div className="residences__Resp">
           
            <div className="residences__resp__header">
                
                <div className="res__resp__action ">
                        {ONGLETS.map((o) =>(
                            <button key={o.cle} role="tab" className={`tab ${statut === o.cle ? "tab-active" : ""}` } onClick={()=> {setStatut(o.cle);setPage(1);}}><label className="stat__info"> {o.titre} </label>{compteurs[o.cle] !== undefined && (<span>{compteurs[o.cle]}</span>

                            )}
                            </button>
                        ))}
                </div>
                
                
                
            </div>

            <div className="res__resp__body">
                
                <div className="res___resp__body__head">
                    <div className="res__resp__search">
                        <input type="text" placeholder="Rechercher une personne ou une famille..." value={recherche} onChange={(e)=>{setRecherche(e.target.value); setPage(1);}}/>
                    </div>
                    <div className="res__resp__nouveau">
                        <button className="btn__ajouter" onClick={ouvrirBureau}> <img src={ajouter} alt="" /><span>Residence</span> </button>
                    </div>
                </div>
                {message && (
                    <div className="alert alert-success mb-4">
                    <span>{message}</span>
                    <button className="btn btn-xs" onClick={() => setMessage("")}>OK</button>
                    </div>
                )}
                {erreur && <p style={{ color: "red" }}>{erreur}</p>}
                {chargement ? (
                    <p>Chargement ...</p>
                ) : resultats.length === 0 ?(
                    <p>Aucune residence dans cette liste</p>
                ) : (
                    <table >
                        <thead>
                            <tr>
                                <th className="td__first">Photo</th>
                                <th>Titulaire</th>
                                <th>Famille</th>
                                <th>Motif</th>
                                <th>Date demande</th>
                                <th>Statut</th>
                                <th>Details</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resultats.map((r) => (
                                <tr key={r.id}>
                                    <td>
                                        <div className="rep__tab__img">{r.photo && <img src={r.photo} className="td__first"/>} </div>
                                    </td>
                                    <th>{r.personne}</th>
                                    <td>{r.famille}</td>
                                    <td>{r.motif}</td>
                                    <td>{date(r.date_demande)}</td>
                                    <td>{badge(r)}</td>
                                    <td>{details(r)}</td>
                                    <td className="action__res__resp">
                                        {r.status === "A_PAYER" && (
                                        <button 
                                                onClick={() => ouvrirDecision(r, "encaisser")}className="btn-success">Encaisser</button>
                                        )}
                                        {r.status === "EN_ATTENTE" && (
                                        <>
                                            <button className=" btn-success"
                                                    onClick={() => ouvrirDecision(r, "valider")}>Valider</button>
                                            <button className=" btn-error"
                                                    onClick={() => ouvrirDecision(r, "refuser")}>Refuser</button>
                                        </>
                                        )}
                                        {r.status === "VALIDE" && !r.revoquee && (
                                          <>
                                          
                                          <button className="btn btn-xs" onClick={() => telechargerCertificat(r.id)}>PDF</button>
                                          <button className="btn-error"
                                                onClick={() => ouvrirDecision(r, "revoquer")}>Révoquer</button>
                                        </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="res__resp__footer pagination__parent">
                <div className="pagination__info">
                    <h4>Nombres total : </h4>
                     <span className="text-sm"> {pagination.total} demande(s)</span>
                </div>
                <div className="pagination__action">
                    <button disabled={page === 1} onClick={() => setPage(1)}><img src={debut} className="pagination_img"/>
                    </button>
                    <button disabled={page === 1} onClick={() => setPage(page - 1)}><img src={precedent} className="pagination_img2"/></button>
                    <span>Page {pagination.page} / {pagination.pages}</span>
                    <button disabled={page === pagination.pages} onClick={() => setPage(page + 1)}><img src={suivant} className="pagination_img2"/></button>
                    <button disabled={page === pagination.pages} onClick={() => setPage(pagination.pages)}><img src={fin} className="pagination_img"/></button>
                </div>


            </div>
            <dialog ref={modalBureau}>
                <h3>Nouvel demande de residence</h3>
                {erreurBureau && (
                <div className="error">
                    <span>{erreurBureau}</span>
                </div>
                )}
                <div className="form__res__resp">
                    <label>Famille :</label>
                    {carnet ?(
                        <div>
                            <span>{carnet.chef} - {carnet.adresse}</span>
                            <button onClick={() => {setCarnet(null);setRechercheCarnet("");}}>Changer</button>
                        </div>
                    ): (
                        <>
                        <input  placeholder="Tape le nom de la famille…"
                                value={rechercheCarnet} onChange={(e) => setRechercheCarnet(e.target.value)} />
                        <ul >
                            {carnetsTrouves.map((c) => (
                            <li key={c.id}>
                                <button type="button" onClick={() => choisirCarnet(c)}>
                                {c.chef} - {c.adresse}
                                </button>
                            </li>
                            ))}
                        </ul>
                        </>
                    )}
                    {carnet && (
                        <>
                        <label >Demandeur</label>
                        <select  value={demandeur}
                                onChange={(e) => setDemandeur(e.target.value)}>
                            {personnes.parents.map((p) => (
                            <option key={p.id} value={p.id}>{p.role} : {p.nom}</option>
                            ))}
                        </select>

                        <label >Personne concernée</label>
                        <select  value={concerne}
                                onChange={(e) => setConcerne(e.target.value)}>
                            <option value="">-- Choisir--</option>
                            <optgroup label="Parents">
                            {personnes.parents.map((p) => (
                                <option key={`p-${p.id}`} value={`p-${p.id}`}>{p.nom}</option>
                            ))}
                            </optgroup>
                            {personnes.enfants.length > 0 && (
                            <optgroup label="Enfants">
                                {personnes.enfants.map((e) => (
                                <option key={`e-${e.id}`} value={`e-${e.id}`}>{e.nom}</option>
                                ))}
                            </optgroup>
                            )}
                        </select>

                        <label >Motif</label>
                        <input  value={motif}
                                onChange={(e) => setMotif(e.target.value)} placeholder="Ex : dossier bancaire" />

                        <label >
                            <input type="checkbox"  checked={paye}
                                onChange={(e) => setPaye(e.target.checked)} />
                            <span>Espèces encaissées maintenant</span>
                        </label>

                        {paye && (
                            <input 
                                placeholder="N° de reçu (facultatif)" value={reference}
                                onChange={(e) => setReference(e.target.value)} />
                        )}
                        </>
                    )}

                </div>
                <div className="btn__action">
                    <button className="btn__valider" disabled={envoiBureau || !carnet} onClick={envoyerBureau}>
                    {envoiBureau ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    <button className="btn__annuler" onClick={() => modalBureau.current.close()}>Annuler</button>
                </div>
    
            </dialog>
            <dialog ref={modalDecision} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">{decision && TITRES[decision.action]}</h3>
                    {decision && (
                        <p className="py-2">
                        {decision.residence.personne} - famille {decision.residence.famille}
                        </p>
                    )}

                    {decision && (decision.action === "refuser" || decision.action === "revoquer") && (
                        <textarea className="textarea textarea-bordered w-full" placeholder="Motif (obligatoire)"
                                value={motifDecision} onChange={(e) => setMotifDecision(e.target.value)} />
                    )}

                    {erreurDecision && <p style={{ color: "red" }}>{erreurDecision}</p>}

                    <div className="modal-action">
                        <button className="btn btn-primary" disabled={envoiDecision} onClick={confirmerDecision}>
                        {envoiDecision ? "Envoi…" : "Confirmer"}
                        </button>
                        <button className="btn" onClick={() => modalDecision.current.close()}>Annuler</button>
                    </div>
                </div>
            </dialog>
        </div>


    )
}

