import { useEffect , useState } from "react";
import {useNavigate , useParams} from "react-router-dom";
import api from "../api";

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
                    <h3>Verification de certificat de residence</h3>

                    <form action="" onSubmit={chercher}>
                        <input type="text" value={saisie} onChange={(e) =>setSaisie(e.target.value)} />
                        <button>Verifier</button>
                    </form>

                    {chargement && <p >Vérification…</p>}
                    {erreur && <div>{erreur}</div>}

                    {d && (
                        <div className="verification__info">
                            <div className={`alert ${ETATS[d.etat].classe}`}>{ETATS[d.etat].texte}</div>
                            {d.photo && (
                            <img src={d.photo} alt="" className="w-28 h-28 rounded-full object-cover" />
                            )}
                        </div>
                        
                    )}
                </div>
            </div>
        </div>
    )
}