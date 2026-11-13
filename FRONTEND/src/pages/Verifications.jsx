import { useEffect , useState } from "react";
import {useNavigate , useParams} from "react-router-dom";
import api from "../api";
import logos from "../assets/Images/logos.png"
const ETATS = {
    VALIDE: {texte : "Certificat valide" , classe:"alert-success"},
    EXPIREE : {texte:"Certificat expieré",classe:"alert-warning"},
    REVOQUEE:{texte:"Certificat revoqué", classe:"alert-error"}
};

const jour = (d) => new Date(d).toLocaleDateString("fr-FR",{dateStyle:"long"});

export default function Verification(){

    const {code} = useParams();
    const navigate = useNavigate();
    const[saisie,setSaisie] = useState("");
    const [d,setD] = useState("");
    const [erreur, setErreur] = useState("");
    const [chargement, setChargement] = useState(false);

    useEffect(()=>{
        if (!code) return;
        setChargement(true);setD(null);setErreur("");
        api.get(`/verifier/residence/${encodeURIComponent(code)}/`)
        .then(({data})=> setD(data))
        .catch((e)=> setErreur(
            e.response?.status == 404 ? "Aucun certificat valide ne correspond à ce code." : "Vérification impossible pour le moment."
        )).finally(()=> setChargement(false));
    },[code]);

    const chercher = (e) => {
        e.preventDefault();
        if (saisie.trim()) navigate(`/verif/residence/${encodeURIComponent(saisie.trim())}`)
    }
    return(
        <div className="Verification">
            <div className="wrapper">
                <div className="verification__contatiner">
                    <div className="verif__header">
                        <div className="verif__logos">
                            <div className="logos">
                                <div className="img__logos">
                                    <img src={logos} alt="" />
                                </div>
                                <div className="text__logos">
                                    <span className="fkt">Fkt</span>
                                    <span className="logos__lieu">Andohamandry</span>
                                </div>
                            </div>
                        </div>
                        <h4 className="verif__titre">Page de vérification de certificat de résidence</h4>
                    </div>
                    <div className="verif__nb">
                        <p> Ce site est la plateforme officielle de vérification de certificat de résidence de Fokontany d'Andohamandry.</p>
                        <p> Tous les résultats présentés ici sont exacts. Si vous constatez une fausse déclaration de résidence, merci de contacter directement le responsable du Fokontany, cette infraction étant passible de poursuites.</p>
                    </div>
                   
                    <form action="" onSubmit={chercher} className="verif__search">
                        <label htmlFor="">Numero de résidence :</label>
                        <input type="text" value={saisie} onChange={(e) =>setSaisie(e.target.value)} placeholder="RES-00001-A342" />
                        <div className="verif__action">
                            <button className="btn__verifier">Verifier</button>
                        </div>
                        
                    </form>

                    {chargement && <p >Vérification…</p>}
                    {erreur && <div>{erreur}</div>}

                    {d && (
                        <div className="verification__info">
                            <div className={`alert ${ETATS[d.etat].classe}`}>{ETATS[d.etat].texte}</div>
                            {d.photo && (
                            <img src={d.photo} alt="" />
                            )}
                            <h2>{d.nom}-{d.prenom}</h2>
                            <p>N° {d.numero}</p>
                            <p >
                                Délivré le {jour(d.date_validation)}<br />
                                Valable jusqu'au {jour(d.valable_jusqu_au)}
                            </p>
                            {d.etat === "REVOQUEE" && d.motif_revocation && (
                            <p className="text-sm text-error">Motif : {d.motif_revocation}</p>
                            )}
                        </div>
                        
                    )}
                </div>
            </div>
        </div>
    )
}