import { useEffect, useRef, useState } from "react";
import api from "../../api";

import ajouter from "../../assets/Icons/plus.png";
const date = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const ar = (n) => `${Number(n).toLocaleString("fr-FR")} Ar`;
const aujourdhui = () => new Date().toLocaleDateString("en-CA");

function messageErreur(err) {
  const d = err.response?.data;
  if (!d) return "Le serveur ne répond pas.";
  if (typeof d === "string") return `Erreur du serveur (code ${err.response.status}).`;
  if (typeof d.detail === "string") return d.detail;
  if (Array.isArray(d.detail)) return d.detail.join(" ");
  return Object.entries(d).map(([c, v]) => `${c} : ${[].concat(v).join(" ")}`).join(" · ");
}

function etat(r,montant){
    if (r.revoquee) return{ badge: <span>Annulée</span>, texte:r.motif_refus};

    if(r.status === "A_PAYER")
        return {badge:<span>A payer</span>, texte:montant ? `${ar(montant)} a regler au bureau du fokontany`:"A regler au bureau"}
    if (r.status === "EN_ATTENTE")
        return {badge:<span>En cours</span>,texte:"Ta demande est en cours de traitement"};

    if(r.status === "VALIDE"){
        const expire = r.valable_jusqu_au && r.valable_jusqu_au < aujourdhui();
        return expire ? {badge:<span>Expirée</span> ,texte:`Expiree le ${date(r.valable_jusqu_au)}`} : {badge:<span>Validee</span>,texte:`Valable jusqu'au ${date(r.valable_jusqu_au)}`};
    }
    return{ badge:<span>Refusee</span>,texte:r.motif_refus}
}
export default function MesResidence(){
    //liste
    const [residences, setResidences] = useState([]);
    const [famille,setFamille] = useState({parents:[], enfants:[] , montant:null})
    const [chargement , setChargement] = useState(true);
    const [erreur , setErreur] = useState("");
    const [message,setMessage] = useState("");
    const [version,setVersion] = useState(0);

    //demande
    const modal = useRef(null)
    const [concerne , setConcerne] = useState("")
    const [motif,setMotif] = useState("")
    const [envoi, setEnvoi] = useState(false);
    const [erreurDemande, setErreurDemande] = useState("");
    const [impayes, setImpayes] = useState(null); 

    useEffect(() => {
        api.get("/residences/personnes/").then(({data})=>setFamille(data)).catch(()=>{});
    },[])

    useEffect(() =>{
        setChargement(true);
        api.get("/residences/").then(({data}) => {setResidences(data);setErreur("");}).catch(()=> setErreur("Impossible de charger tes demandes.")).finally(() => setChargement(false));
    },[version]);

    function ouvrir() {
    setConcerne(""); setMotif(""); setErreurDemande(""); setImpayes(null);
    modal.current.showModal();
  }

      async function envoyer() {
        if (!concerne || !motif.trim()) {
          setErreurDemande("Choisis la personne concernée et saisis le motif.");
          return;
        }
        setEnvoi(true);
        setErreurDemande("");
        setImpayes(null);
        const [type, id] = concerne.split("-");
        try {
          const { data } = await api.post("/residences/", {
            motif,
            ...(type === "p" ? { parent_concerne: Number(id) } : { enfant_concerne: Number(id) }),
          });
          modal.current.close();
          setMessage(`Demande enregistrée. Présente-toi au bureau pour régler ${ar(data.montant_a_payer)}.`);
          setVersion((v) => v + 1);
        } catch (err) {
          if (err.response?.data?.code === "impayes") setImpayes(err.response.data);
          else setErreurDemande(messageErreur(err));
        } finally {
          setEnvoi(false);
        }
      }

    async function telecharger(id){
        try{
            const {data} = await api.get(`/residences/${id}/pdf/`,{responseType:"blob"});
            const url = URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `certificat_residence_${id}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        }catch(err){
            try{
                setErreur(JSON.parse(await err.response.data.text()).detail || "Impossible de generer le PDF");
            }catch{
                setErreur("Impossible de generer le PDF .")
            }
        }
    }
    return(
        <div className="residencesH">
            <div className="residencesH__headers">
                <div className="wrapper">
                    <div className="residences__headers__container">
                        <h3 className="section__title">Mes demandes de résidence</h3>
                         <div className="res__resp__nouveau">
                                <button className="btn__ajouter" onClick={ouvrir}> <img src={ajouter} alt="" /><span>Nouveau Residence</span> </button>
                        </div>
                         {message && (
                            <div className="">
                            <span>{message}</span>
                            <button className="" onClick={() => setMessage("")}>OK</button>
                            </div>
                        )}
                        {erreur && <p style={{ color: "red" }}>{erreur}</p>}
                                        </div>
                </div>
            </div>
            <div className="residencesH__body">
                <div className="wrapper">
                    <div className="residencesH__body__container">
                        {chargement ? (
                            <p>Chargement...</p>
                        ): residences.length === 0 ?(
                            <p>Tu n'as pas encore fait aucune demande</p>
                        ):(
                            <>
                            <div className="liste__resH">
                                    <ul>
                                        
                                    {residences.map((r) => {
                                        const e = etat(r,famille.montant);
                                        const telechargeable = r.status === "VALIDE" && r.valable_jusqu_au >= aujourdhui();
                                        return(
                                            <li key={r.id}>
                                                <div className="info__resH">
                                                    <label htmlFor="" className="resH_info">Titulaire :</label>
                                                    <label className="resH__value">{r.personne}</label>
                                                </div>
                                                <div className="info__resH">
                                                    <label htmlFor="" className="resH_info">Date de demande :</label>
                                                    <label className="resH__value">{date(r.date_Resid)}</label>
                                                </div>
                                                <div className="info__resH">
                                                    <label htmlFor="" className="resH_info">Motif :</label>
                                                    <label htmlFor="" className="resH__value">{r.motif}</label>
                                                </div>
                                                <label className="resH__alert">{e.texte}</label>
                                                <div className="info__resH resH__badges">
                                                    <label className="resH__badge">{e.badge}</label>
                                                </div>
                                                    
                                                <div>
                                                    {telechargeable &&(
                                                        <button onClick={() => telecharger(r.id)}>Telecharger le PDF</button>
                                                    )}
                                                </div>
                                            </li>
                                        )
                                    })}
                                    </ul>
                            </div>
                            </>
                        )}
                    </div>
                    
                </div>
            </div>

            <dialog ref={modal}>
                    <div className="modal__res__head">
                        <h3>Nouvelle demande de residence</h3>
                        {erreurDemande && (
                            <div className="alert alert-error mb-3"><span>{erreurDemande}</span></div>
                        )}

                        {impayes && (
                            <div className="alert alert-warning">
                                 <span>{impayes.detail} ({impayes.mois.length} mois, {ar(impayes.montant_du)})</span>
                                    <Link to="/habitant/cotisations" className="btn btn-sm">Voir mes cotisations</Link>
                            </div>
                        )}
                        <label htmlFor="">Pour qui?</label>
                        <select  value={concerne}
                  onChange={(e) => { setConcerne(e.target.value); setErreurDemande(""); }}>
                            <option value="">— Choisir —</option>
                            <optgroup label="Parents">
                            {famille.parents.map((p) => (
                                <option key={`p-${p.id}`} value={`p-${p.id}`}>{p.nom}</option>
                            ))}
                            </optgroup>
                            {famille.enfants.length > 0 && (
                            <optgroup label="Enfants">
                                {famille.enfants.map((e) => (
                                <option key={`e-${e.id}`} value={`e-${e.id}`}>{e.nom}</option>
                                ))}
                            </optgroup>
                            )}
                        </select>

                         <label className="label">Motif</label>
                            <input className="input input-bordered w-full" value={motif}
                                    onChange={(e) => { setMotif(e.target.value); setErreurDemande(""); }}
                                    placeholder="Ex : dossier bancaire" />

                            {famille.montant && (
                                <p className="text-sm mt-3">Tarif du certificat : <strong>{ar(famille.montant)}</strong>, à régler au bureau.</p>
                            )}

                            <div className="modal-action">
                                <button className="btn btn-success" disabled={envoi} onClick={envoyer}>
                                {envoi ? "Envoi…" : "Envoyer la demande"}
                                </button>
                                <button className="btn" onClick={() => modal.current.close()}>Annuler</button>
                            </div>
                    </div>
            </dialog>
        </div>
    )
}