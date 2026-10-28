import { useEffect, useRef, useState } from "react";
import api from "../../api";
import ajouter from "../../assets/Icons/plus.png";

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
              <ParentFields titre="Père" professions= {professions} nationalites={nationalites}/>
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

function ParentFields({titre , professions=[] , nationalites=[]}){
    return(
      <fieldset>
        <legend>{titre}</legend>
        <input type="text" placeholder="Nom" />
        <input type="text" placeholder="Prenom" />
        <input type="date"  />
        <input type="text" placeholder="Lieu de naissance"  />
        <input type="text"  placeholder="Nom du père"/>
        <input type="text" placeholder="Nom de la mère" />
        <input type="text" placeholder="Téléphone de 10 chiffres"/>
        <div className="parent__nationalites">
          <label htmlFor="">Nationalites :</label>
          <select >
            <option value="">--Choisir--</option>
            {nationalites.map((n) => 
            <option key={n.id} value={n.id}>{n.nationalite ?? p.id}</option>)}
          </select>
        </div>
        <div className="parent__identite__CIN">
          <label htmlFor=""> N Cin:</label>
          <input type="text" />

          <label htmlFor="">Date de delivrence :</label>
          <input type="date"/>

          <label htmlFor="">Lieu de delivrence :</label>
          <input type="text"/>

        </div>
        <div className="parent__identite__Passport">
            <label htmlFor="">N Passport :</label>
            <input type="text"/>

            <label htmlFor="">Date d'expiration</label>
            <input type="date" />
        </div>
        <div className="parent_proprietaire">
            <label htmlFor="">Proprietaire:</label>
            <input type="checkbox" />
        </div>
        <div className="parent__profession">
          <label htmlFor="">Profession :</label>
          <select >
            <option value="">--Choisir--</option>
            {professions.map((p) => 
            <option key={p.id} value={p.id}>{p.nom_Prof ?? p.id}</option>)}
          </select>
        </div>
        
      </fieldset>
    )
}
