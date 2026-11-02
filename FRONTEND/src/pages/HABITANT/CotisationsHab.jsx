import { useEffect, useRef, useState } from "react";
import api from "../../api";
import warning from "../../assets/Icons/warning.png";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet",
  "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const ar = (n) => `${Number(n).toLocaleString("fr-FR")} Ar`;

export default function CotisationsHab(){
    const [data,setData] = useState(null)
    const [erreur, setErreur] = useState("");
    const modal = useRef(null);

    useEffect(() => {
        api.get("/cotisations/")
        .then(({ data }) => setData(data))
        .catch(() => setErreur("Impossible de charger tes cotisations."));
    }, []);

    if (erreur) return <p style={{ color: "red" }}>{erreur}</p>;
    if (!data) return <p>Chargement...</p>;

    const aJour = data.nb_impaye === 0;
     const mois = [...data.mois].sort((a, b) => b.annee - a.annee || b.mois - a.mois);
    return(
        <div className="cotisationsHab">
            <div className="wrapper">
                <div className="cotisationsHab__container">
  
                    <div className="cotisationsHab__body">
                        <div className="cotisationsHab__stat">
                            <div className="stat">
                                <label htmlFor="" className="stat__valeur">{ar(data.montant_mensuel)}</label>
                                <label htmlFor="" className="stat__info">Cotisation mensuelle </label>
                            </div>
                            <div className="stat stat__child__cot">
                                <label className="stat__valeur">{data.nb_impaye}</label>
                                <label className="stat__info"> Nombres mois impayes </label>
                            </div>
                            <div className="stat">
                                <label className="stat__valeur">{ar(data.total_du)}</label>
                                <label htmlFor=""  className="stat__info">Total à payer </label>
                            </div>
                        </div>
                        <div className="cotisationsHab__header">
                            {aJour ? (
                                <div className="alert--success">
                                    
                                    <span>Tu es a jours de tes cotisations </span>
                                </div>
                            ):(
                                <div className="alert--error">
                                    <img src={warning} alt="" />
                                    <span> Tu as {data.nb_impaye} mois impayé {data.nb_impaye > 1 ? "s" : "" } : {""}<strong> {ar(data.total_du)} </strong> à payer</span>
                                    <button className="btn-paye" onClick={() => modal.current.showModal()}>
                                        Comment payer ?
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="cotisationsHab__mois">
                            <label htmlFor=""> MES MOIS :</label>
                          <div className="mois-grid">
                            {mois.map((m) => {
                                const isPaye = m.status === "PAYE";
                                
                                return (
                                <div 
                                    key={`${m.annee}-${m.mois}`}
                                    className={`mois-card ${isPaye ? "mois-card--paye" : "mois-card--impaye"}`}
                                >
                                    <span className="mois-card__nom">{MOIS[m.mois - 1]} /</span>

                                    <span className="mois-card__annee">{m.annee}</span>
                                    
                                    <span className={`mois-card__badge ${isPaye ? "mois-card__badge--paye" : "mois-card__badge--impaye"}`}>
                                    {isPaye ? "Payé" : "Impayé"}
                                    </span>
                                </div>
                                );
                            })}
                            </div>

                        </div>
                    </div>

                </div>
            </div>
            <dialog ref={modal}>
                <h3>Comment payer ?</h3>

                <p>Présente-toi au bureau du fokontany avec ton carnet. Le responsable enregistrera
            ton paiement en espèces et tes mois passeront à « Payé ».</p>

            <label htmlFor="">Le paiement par MVola sera bientôt disponible.</label>
            <div className="modal-action">
                <button className="btn" onClick={() => modal.current.close()}>Fermer</button>
            </div>
            </dialog>
        </div>
        
    )
}