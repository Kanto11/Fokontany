import { useEffect, useRef, useState } from "react";
import api from "../../api";
import ajouter from "../../assets/Icons/plus.png";

const parentvide ={
  nom_P : "" , prenom_P : "" ,date_nais_P : "" ,lieu_nais_P :"", nom_pere_P : "", nom_mere_P: "" , prof_P :"" ,tel_P : "",nationalite_P :"", proprietaire_P : false , email : "" , mot_de_passe :"" ,email_verif : "" , Cin_P : " ",date_delivrence_P : "" ,lieu_delivrence_P : "" , Passport :"" , date_expiration :""}
export default function CarnetDialog({}) {
  const dialogRef = useRef(null);     
  const ouvrir = () => dialogRef.current.showModal();
  const fermer = () => dialogRef.current.close();

  //--------------------log-declaration------------------------
  const dialogLog = useRef(null);
  const [secteurs , setSecteurs] = useState([]);
  const [secteur, setSecteur] = useState("");
  const [largeur ,  setLargeur] = useState("");
  const [hauteur , sethauteur] = useState("");
  const [adresse ,  setAdresse] = useState("");
  const [erreursLog, setErreursLog] = useState({});
  
    
  const ouvrirLog = () => {
    if (dialogLog.current){
        dialogLog.current.showModal();
    }else{
        console.error("Le dialogue n'est pas encore chargé dans le DOM.");
    }
  }

  const fermerLog = () => {
       try {
        setAdresse("");
        sethauteur("");
        setLargeur("");
        setSecteur(""); 

      if (typeof setErreursLog === "function") {
      setErreursLog({});
      }

      dialogLog.current.close();
    
    } catch (error) {
      console.error("Erreur lors de la fermeture :", error);
    }
  } 
 
  //--------------------habitant--------------------
    //log
  const [logements, setLogements] = useState([]);
  const [adresseH, setAdresseH] = useState("");
  const [logementId , setLogementId] = useState("");
  const [erreurLog ,setErreurLog] = useState("");
  const [pere , setPere] = useState(parentvide);
  const [mere , setMere] = useState(parentvide);
  
  function changerAdresse(e){
    const valeur = e.target.value;
    setAdresseH(valeur);
    const trouve = logements.find(
      (log) => log.adr_Log.toLowerCase() === valeur.trim().toLowerCase()
    );

    if(trouve) {
      setLogementId(trouve.id);
      setErreurLog("");
    }else{
      setLogementId("");
      setErreurLog("Cette adresse n'existe pas");
    }
  }

  // autre champ
  const [professions ,  setProfessions] = useState([]);
  const [nationalites  , setNationalites] = useState([]);

 

  useEffect(()=>{
    api.get("/secteurs/").then(({data})=> setSecteurs(data)).catch(()=>{});
    api.get("/logements/").then(({data}) => setLogements(data)).catch((err) => console.error("LOGEMENTS :", err.response?.status, err.response?.data));
    api.get("/professions/").then(({data})=> setProfessions(data)).catch(()=>{});
    api.get("/nationalites/").then(({data}) => setNationalites(data)).catch(()=>{});
  },[])


  //----------------------validation-------------------
   const btnvalideLog =  async (e) => {
    e.preventDefault()
    setErreursLog({});
     let lesErreurs = {}
    if (!adresse.trim()){
      lesErreurs.adresse = "L'adresse est obligatoire";
    }
    if (!hauteur || (hauteur < 1)  ){
      lesErreurs.hauteur = "L'hauteur est obligatoire et devrais etre positif";
    }

    if (!largeur || (largeur < 5)  ){
      lesErreurs.largeur = "La largeur est obligatoire et devrais etre superieur de 5";
    }

    if (!secteur.trim() || (secteur == "Tous")  ){
      lesErreurs.secteur = "Veuillez selectionné un un secteur";
    }

     if (Object.keys(lesErreurs).length > 0) {
    setErreursLog(lesErreurs);
    return;
  }
  const res = await api.post("/logements/",{
        adr_Log : adresse,
        hauteur_Log : hauteur,
        largeur_Log : largeur,
        secteur : secteur
      })

      setAdresse("");
      sethauteur("");
      setSecteur("");
      setLargeur("");
      const reinitialiserLog = api.get("/logements/").then(({data}) => setLogements(data)).catch((err) => console.error("LOGEMENTS :", err.response?.status, err.response?.data));
      dialogLog.current.close();
      
   }   


  return (
    <>
      <button onClick={ouvrir}>+ Nouveau carnet</button>

      <dialog ref={dialogRef}>
        <form className="carnetDialog">
          <div className="btn__fermer" onClick={fermer}>fermer</div>
          <h2>Nouveau carnet</h2>

          <div className="logement__ajout">
            <label>Logement :</label>
            <input type="text" 
            list="liste-logements"
            className={`input input-bordered w-full ${erreurLog ? "input-error" : ""}`}
            placeholder="Tape l'adresse du logement…"
            value={adresseH}
            onChange={changerAdresse}
            />
            <datalist id="liste-logements">
              {logements.map((log) => (
                <option key={log.id} value={log.adr_Log}/>
              ))}
            </datalist>
            {erreurLog && <p style={{ color: "red" }}>{erreurLog}</p>}
            <button className="btn__ajouter" type="button" onClick={ouvrirLog}>
              <img src={ajouter} alt="" />
              <span>Nouveau logement</span>
            </button>
          </div>
          <div className="parent__ajout">
              <ParentFields titre="Père" professions= {professions} nationalites={nationalites} valeur={pere}/>
              <ParentFields titre="Mère" professions= {professions} nationalites={nationalites} valeur={mere}/>
          </div>

          <div className="btn__carnetDialog btn__action">
              <button className="btn__valider">Valider</button>
              <button  className="btn__annuler">Annuler</button>
          </div>
        </form>
      </dialog>

      <dialog ref={dialogLog}>
        <h2 className="title__dialog">
          Ajout du nouvel logement
        </h2>
        <form action="" >
            <label htmlFor="">Adresse :</label>
            <input type="text"  value={adresse} onChange={(e) => setAdresse(e.target.value)}/>
            {erreursLog.adresse && <p style={{ color: "red" }}>{erreursLog.adresse}</p>}

            <label htmlFor="">Secteur : </label>
            <select value={secteur} onChange={(e) => setSecteur(e.target.value)}>
                  <option value="">Tous</option>
                  {secteurs.map((s) => (
                    <option key={s.id} value={s.id}>{s.nom_S || `Secteur ${s.id}`}</option>
                  ))}
            </select>
            {erreursLog.secteur && <p style={{ color: "red" }}>{erreursLog.secteur}</p>}


            <label htmlFor="" >Hauteur : (m)</label>
            <input type="number" value={hauteur} onChange={(e) => sethauteur(e.target.value)} />
            {erreursLog.hauteur && <p style={{ color: "red" }}>{erreursLog.hauteur}</p>}

            <label htmlFor="" >Largeur : (m²)</label>
            <input type="number" value={largeur} onChange={(e) => setLargeur(e.target.value)} />
            {erreursLog.largeur && <p style={{ color: "red" }}>{erreursLog.largeur}</p>}
        </form>
        

        <div className="action__log btn__action">
          <button className="btn__valider" onClick={btnvalideLog}>Enregistrer</button>
          <button onClick={fermerLog} className="btn__annuler">Annuler</button>
        </div>
      
      </dialog>
    </>
  );
}

//----pere et mere----
function ParentFields({ titre, professions = [], nationalites = [], valeur, onChange }) {

  if (!valeur) return null; 

  const set = (champ, v) => onChange({ ...valeur, [champ]: v });

  return (
    <fieldset>
      <legend>{titre}</legend>
      <label htmlFor="">Nom :</label>
      <input type="text" value={valeur.nom_P || ""} onChange={(e) => set("nom_P", e.target.value)} />

      <label htmlFor="">Prénom :</label>
      <input type="text" value={valeur.prenom_P || ""} onChange={(e) => set("prenom_P", e.target.value)} />

      <label htmlFor="">Date de naissance :</label>
      <input type="date" value={valeur.date_nais_P || ""} onChange={(e) => set("date_nais_P", e.target.value)} />

      <label htmlFor="">Lieu de naissance :</label>
      <input type="text" value={valeur.lieu_nais_P || ""} onChange={(e) => set("lieu_nais_P", e.target.value)} />

      <label>Nom du père :</label>
      <input type="text" value={valeur.nom_pere_P || ""} onChange={(e) => set("nom_pere_P", e.target.value)} />

      <label htmlFor="">Nom de la mère</label>
      <input type="text" value={valeur.nom_mere_P || ""} onChange={(e) => set("nom_mere_P", e.target.value)} />

      <label htmlFor="">Téléphone : (10 Chiffres)</label>
      <input type="text" placeholder="Téléphone de 10 chiffres" value={valeur.tel_P || ""} onChange={(e) => set("tel_P", e.target.value)} />

      <div className="parent__nationalites">
        <label htmlFor="">Nationalités :</label>
        <select value={valeur.nationalite_P || ""} onChange={(e) => set("nationalite_P", e.target.value)}>
          <option value="">--Choisir--</option>
          {nationalites.map((n) => (
            <option key={n.id} value={n.id}>{n.nationalite ?? n.id}</option>
          ))}
        </select>
      </div>

      <div className="origine__parent">
        
        {valeur.nationalite_P == "2" && (
          <div className="parent__identite__CIN">
            <label htmlFor=""> N Cin:</label>
            <input type="text" value={valeur.cin_P || ""} onChange={(e) => set("cin_P", e.target.value)} />

            <label htmlFor="">Date de délivrance :</label>
            <input type="date" value={valeur.date_cin_P || ""} onChange={(e) => set("date_cin_P", e.target.value)} />

            <label htmlFor="">Lieu de délivrance :</label>
            <input type="text" value={valeur.lieu_cin_P || ""} onChange={(e) => set("lieu_cin_P", e.target.value)} />
          </div>
        )}

   
        {valeur.nationalite_P == "1" && (
          <div className="parent__identite__Passport">
            <label htmlFor="">N Passport :</label>
            <input type="text" value={valeur.passport_P || ""} onChange={(e) => set("passport_P", e.target.value)} />

            <label htmlFor="">Date d'expiration</label>
            <input type="date" value={valeur.exp_passport_P || ""} onChange={(e) => set("exp_passport_P", e.target.value)} />
          </div>
        )}
      </div>
     
      <div className="parent_proprietaire">
        <label htmlFor="">Propriétaire :</label>
        <input 
          type="checkbox" 
          checked={!!valeur.est_proprietaire} 
          onChange={(e) => set("est_proprietaire", e.target.checked)} 
        />
      </div>

      <div className="parent__profession">
        <label htmlFor="">Profession :</label>

        <select value={valeur.profession_id || ""} onChange={(e) => set("profession_id", e.target.value)}>
          <option value="">--Choisir--</option>
          {professions.map((p) => (
            <option key={p.id} value={p.id}>{p.nom_Prof ?? p.id}</option>
          ))}
        </select>
      </div>

      <div className="parent__compte">
        <label htmlFor="">Email :</label>
        <input type="text" value={valeur.email_P || ""} onChange={(e) => set("email_P", e.target.value)} />

        <label htmlFor="">Mot de passe</label>
        <input type="password" value={valeur.password_P || ""} onChange={(e) => set("password_P", e.target.value)} />

        <label htmlFor="">Confirmation mot de passe</label>
        <input type="password" value={valeur.password_conf_P || ""} onChange={(e) => set("password_conf_P", e.target.value)} />
      </div>
    </fieldset>
  );
}
