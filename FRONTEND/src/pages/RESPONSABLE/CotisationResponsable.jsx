import { useEffect ,useState, useRef } from "react"
import api from "../../api";

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
  "août", "septembre", "octobre", "novembre", "décembre"];

const nomMois = (annee, mois) => `${MOIS[mois - 1]} ${annee}`;

const cle = (m) => `${m.annee}-${m.mois}`;
const ar = (n) => `${Number(n).toLocaleString("fr-FR")} Ar`;

const dernierPaye = (s) => {
  if (!s) return "Aucun";
  const [a, m] = s.split("-");
  return nomMois(Number(a), Number(m));
};

export default function CotisationResponsable(){
    const [resume ,setResume] = useState(null);

    const [lignes, setLignes] = useState([]);
    const [chargement , setChargement] = useState(true)
    const [erreur , setErreur] = useState("")

    const modalencaisser = useRef(null);
    const [famille , setFamille] = useState(null);
    const [coches, setCoches] = useState([]);

    const [secteurs, setSecteurs] = useState([]);
    const [recherche, setRecherche] = useState("");
    const [secteur, setSecteur] = useState("");
    const [statut, setStatut] = useState("retard");
    const [version, setVersion] = useState(0);
    const [envoi ,setEnvoi] = useState(false);
    const [erreurPaiement, setErreurPaiement] = useState("")

     useEffect(() => {
    api.get("/secteurs/").then(({ data }) => setSecteurs(data)).catch(() => {});
  }, []);

    useEffect(() => {
    setChargement(true);
    const t = setTimeout(() => {
      api.get("/cotisations/responsable/", { params: { q: recherche, secteur, statut } })
        .then(({ data }) => {
          setResume(data.resume);
          setLignes(data.resultats);
          setErreur("");
        })
        .catch(() => setErreur("Impossible de charger les cotisations."))
        .finally(() => setChargement(false));
    }, recherche ? 300 : 0);
    return () => clearTimeout(t);
  }, [recherche, secteur, statut, version]);

    function ouvrirEncaisser(ligne){
        setFamille(ligne);
        setCoches(ligne.mois_impayes.map(cle));
        setErreurPaiement("")  
        modalencaisser.current.showModal();
    }
    function fermerEncaisser(){
        modalencaisser.current.close();
    }

    function basculer(m) {
    setCoches((c) => (c.includes(cle(m)) ? c.filter((x) => x !== cle(m)) : [...c, cle(m)]));
  }
    const moisChoisis = famille ? famille.mois_impayes.filter((m) => coches.includes(cle(m))) : [];
    const total = moisChoisis.reduce((somme, m) => somme + m.prix, 0);

    async function encaisser() {
        setEnvoi(true);
        setErreurPaiement("");
        try{
            await api.post("/cotisations/encaisser/",{
                carnet:famille.carnet_id,
                mois : moisChoisis.map((m) => ({annee : m.annee ,mois :m.mois})),
            });
            modalencaisser.current.close();
            setVersion((v) => v+1);
        }   catch(err){
            setErreurPaiement(err.response?.data?.detail || "Le paiement n'a pas pu être enregistré.")
        } finally{
            setEnvoi(false)
        }
    }
    return(
        <div className="cotisations">
            <div className="costisations__containers">
                <div className="cotisations__header">
                    {resume && (
                        <div className="cotisations__stat">
                            <div className="cotisations__stat__child ">
                                
                                <p className="stat__valeur">Ar {resume.encaisse_mois}</p>
                                <label className="stat__info" htmlFor="">Encaissé ce mois </label>
                            </div>
                            <div className="cotisations__stat__child cot__child__center ">
                                
                                <p className="stat__valeur">{resume.familles_a_jour}</p>
                                <label className="stat__info" htmlFor="">Famille a jour </label>
                            </div>
                            <div className="cotisations__stat__child ">
                                
                                <p className="stat__valeur">{resume.familles_en_retard}</p>
                                <label className="stat__info" htmlFor="">Famille en retard </label>
                            </div>
                            

                    </div>
                    )}
                    
                    <div className="cotisations__filtre">
                        <div className="cot__filtre__child">
                            <input type="text" placeholder="Par nom et numero carnet..." value={recherche} onChange={(e) => setRecherche(e.target.value)}/>
                        </div>
                        <div className="cot__filtre__child">
                                <select name="" id="" value={secteur} onChange={(e) =>setSecteur(e.target.value)}>
                                    <option value="">--Tous les secteur--</option>
                                    {secteurs.map((s) => (
                                    <option key={s.id} value={s.id}>{s.nom_S || `Secteur ${s.id}`}</option>
                                    ))}
                                </select>
                        </div>
                        <div className="cot__filtre__child">
                                <select name="" id="" value={statut} onChange={(e) => setStatut(e.target.value)}>
                                    <option value="tous">--Tous les status--</option>
                                    <option value="jour">A jour</option>
                                    <option value="retard">En retard</option>
                                </select>
                        </div>
                    </div>
                </div>
                <div className="cotisations__body">
                    {erreur && <p style={{color:"red"}}>{erreur}</p>}
                    {chargement ? (
                        <p>Chargement...</p>
                        ) : lignes.length === 0 ? (
                        <p> Aucune famille ne correspond .</p>) :
                        (
                    <table className="table__cotisation">
                            <thead>
                                <tr>
                                    <th>Famille</th>
                                    <th>Secteur</th>
                                    <th>Dernier mois paye</th>
                                    <th>Mois impayes</th>
                                    <th>Montant dû</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lignes.map((l) =>(
                                    <tr key={l.carnet_id}>
                                        <td>{l.chef}</td>
                                        <td>{l.secteur}</td>
                                        <td>{dernierPaye(l.dernier_mois_paye)}</td>
                                        <td>
                                            {l.nb_impayes > 0
                                                ? <span >{l.nb_impayes}</span>
                                                : <span >À jour</span>}
                                        </td>
                                        <td>
                                            {l.nb_impayes > 0 && (
                                                <button onClick={()=> ouvrirEncaisser(l)} className="btn__valider">Encaisser</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                    </table>
                    )}

                    <dialog ref={modalencaisser} className="modalencaisser" >
                            <h3>Encaisser - {famille?.chef}</h3>

                            {famille?.mois_impayes.map((m) => (
                                <label key={cle(m)}>
                                        <input type="checkbox"  checked={coches.includes(cle(m))} onChange={() => basculer(m)}/>
                                        <span >{nomMois(m.annee, m.mois)}</span>
                                        <span> {ar(m.prix)}</span>
                                </label>
                            ))}
                            <p>Total : {ar(total)}</p>
                            
                            <div className="btn__action">
                                {erreurPaiement && <p style={{ color: "red" }}>{erreurPaiement}</p>}
                                <button className="btn__valider" disabled={moisChoisis.length === 0} onClick={encaisser}>
                                   {envoi ? "Enregistrement…" : "Reçu en espèces"}
                                </button>
                                 <button className="btn__annuler" onClick={fermerEncaisser}>Annuler</button>
                            </div>
                    </dialog>
                </div>
            </div>
        </div>
    )
}