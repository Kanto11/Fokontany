import { useEffect, useRef, useState } from "react";
import api from "../../api";
import ajouter from "../../assets/Icons/plus.png";

const parentVide = {
  nom_P: "", prenom_P: "", date_nais_P: "", lieu_nais_P: "",
  nom_pere_P: "", nom_mere_P: "", tel_P: "", proprietaire_P: false,
  profession: "", nationalite: "", email: "", mot_de_passe: "",
};
const enfantVide = {
  nom_Ef: "", prenom_Ef: "", date_nais_Ef: "", lieu_nais_Ef: "",
  nationalite: "", profession: "",
};


export default function CarnetDialog({ logements = [], professions = [], nationalites =[], onCreated=[] }) {
  const dialogRef = useRef(null);          
  const dialogLog = useRef(null);
  const [logement, setLogement] = useState("");
  const [logements, setLogements] = useState([]);  
  const [pere, setPere] = useState(parentVide);
  const [mere, setMere] = useState(parentVide);
  const [enfants, setEnfants] = useState([]);
  const [erreurs, setErreurs] = useState(null);
  
  const [secteurs , setSecteurs] = useState([]);
  const [secteur, setSecteur] = useState("");
  const [largeur ,  setLargeur] = useState("");
  const [hauteur , sethauteur] = useState("");
  const [adresse ,  setAdresse] = useState("");
  const [erreursLog, setErreursLog] = useState({});

 

  const ouvrir = () => dialogRef.current.showModal();
  const fermer = () => dialogRef.current.close();

  //log
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

  useEffect(()=>{
    api.get("/secteurs/").then(({data})=> setSecteurs(data)).catch(()=>{});
    api.get("/logements/").then(({data}) => setLogements(data)).catch((err) => console.error("LOGEMENTS :", err.response?.status, err.response?.data));
  },[])


   const btnvalideLog =  async (e) => {
    e.preventDefault()
    setErreursLog({});
     let lesErreurs = {}
    if (!adresse.trim()){
      lesErreurs.adresse = "L'adresse est obligatoire";
    }
    if (!hauteur.trim() || (hauteur < 1)  ){
      lesErreurs.hauteur = "L'hauteur est obligatoire et devrais etre positif";
    }

    if (!largeur.trim() || (largeur < 5)  ){
      lesErreurs.largeur = "La largeur est obligatoire et devrais etre superieur de 5";
    }

    if (!secteur.trim() || (secteur == "Tous")  ){
      lesErreurs.secteur = "Veuillez selectionné un un secteur";
    }

     if (Object.keys(lesErreurs).length > 0) {
    setErreursLog(lesErreurs);
    return;
  }
      const res = await api.post("logements/",{
        adr_Log : adresse,
        hauteur_Log : hauteur,
        largeur_Log : largeur,
        secteur : secteur
      })

      setAdresse("");
      sethauteur("");
      setSecteur("");
      setLargeur("");

      dialogLog.current.close();
      
   }   


  // enfants :
  const ajouterEnfant = () => setEnfants([...enfants, { ...enfantVide }]);
  const changerEnfant = (i, champ, valeur) =>
    setEnfants(enfants.map((e, idx) => (idx === i ? { ...e, [champ]: valeur } : e)));
  const retirerEnfant = (i) => setEnfants(enfants.filter((_, idx) => idx !== i));

  // --- on nettoie un parent avant envoi
  const nettoyerParent = (p) => {
    if (!p.nom_P.trim()) return undefined;        // parent non rempli -> on ne l'envoie pas
    const copie = { ...p };
    if (!copie.email || !copie.mot_de_passe) {    // email + mdp vont ensemble
      delete copie.email;
      delete copie.mot_de_passe;
    }
    return copie;
  };

  const envoyer = async (e) => {
    e.preventDefault();
    setErreurs(null);

    const payload = {
      logement: Number(logement),
      pere: nettoyerParent(pere),
      mere: nettoyerParent(mere),
      enfants: enfants.map((en) => ({ ...en, profession: en.profession || null })),
    };

    const rep = await fetch("http://127.0.0.1:8000/api/carnets/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`, // adapte à ton auth
      },
      body: JSON.stringify(payload),
    });

    if (rep.ok) {
        const data = await rep.json();      // {id, token, qr_code, pere, mere, enfants}
        fermer();
        setLogement(""); setPere(parentVide); setMere(parentVide); setEnfants([]);
        onCreated?.(data);                  // on passe data à la page
                // ex : recharger la liste des carnets
    } else {
      setErreurs(await rep.json());  // DRF renvoie les erreurs champ par champ
    }
  };

  return (
    <>
      <button onClick={ouvrir}>+ Nouveau carnet</button>

      <dialog ref={dialogRef}>
        <form onSubmit={envoyer} className="carnetDialog">
          <h2>Nouveau carnet</h2>

          <div className="logement__ajout">
            <label>Logement
              <select value={logement} onChange={(e) => setLogement(e.target.value)} required>
                <option value="">-- choisir --</option>
                {logements.map((l) => 
                  <option key={l.id} value={l.id}>
                    {l.adr_Log}
                  </option>)}
              </select>
            </label>
            <button className="btn__ajouter" type="button" onClick={ouvrirLog}>
              <img src={ajouter} alt="" />
              <span>Nouveau logement</span>
            </button>
            
            
          </div>
          

          <ParentFields titre="Père" valeur={pere} onChange={setPere}
            professions={professions} nationalites={nationalites} />
          <ParentFields titre="Mère" valeur={mere} onChange={setMere}
            professions={professions} nationalites={nationalites} />

          <h3>Enfants</h3>
          {enfants.map((en, i) => (
            <fieldset key={i}>
              <legend>Enfant {i + 1}</legend>
              <input placeholder="Nom" value={en.nom_Ef}
                onChange={(e) => changerEnfant(i, "nom_Ef", e.target.value)} required />
              <input placeholder="Prénom" value={en.prenom_Ef}
                onChange={(e) => changerEnfant(i, "prenom_Ef", e.target.value)} required />
              <input type="date" value={en.date_nais_Ef}
                onChange={(e) => changerEnfant(i, "date_nais_Ef", e.target.value)} required />
              <input placeholder="Lieu de naissance" value={en.lieu_nais_Ef}
                onChange={(e) => changerEnfant(i, "lieu_nais_Ef", e.target.value)} required />
              <select value={en.nationalite}
                onChange={(e) => changerEnfant(i, "nationalite", e.target.value)} required>
                <option value="">Nationalité</option>
                {nationalites.map((n) => <option key={n.id} value={n.id}>{n.nom_N ?? n.id}</option>)}
              </select>
              <button type="button" onClick={() => retirerEnfant(i)}>Retirer</button>
            </fieldset>
          ))}
          <button type="button" onClick={ajouterEnfant}>+ Ajouter un enfant</button>

          {erreurs && <pre style={{ color: "red" }}>{JSON.stringify(erreurs, null, 2)}</pre>}

          <div>
            <button type="button" onClick={fermer}>Annuler</button>
            <button type="submit">Créer le carnet</button>
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

// Petit sous-composant réutilisé pour le père ET la mère
function ParentFields({ titre, valeur, onChange, professions, nationalites }) {
  const set = (champ, v) => onChange({ ...valeur, [champ]: v });
  return (
    <fieldset>
      <legend>{titre}</legend>
      <input placeholder="Nom" value={valeur.nom_P} onChange={(e) => set("nom_P", e.target.value)} />
      <input placeholder="Prénom" value={valeur.prenom_P} onChange={(e) => set("prenom_P", e.target.value)} />
      <input type="date" value={valeur.date_nais_P} onChange={(e) => set("date_nais_P", e.target.value)} />
      <input placeholder="Lieu de naissance" value={valeur.lieu_nais_P} onChange={(e) => set("lieu_nais_P", e.target.value)} />
      <input placeholder="Nom du père" value={valeur.nom_pere_P} onChange={(e) => set("nom_pere_P", e.target.value)} />
      <input placeholder="Nom de la mère" value={valeur.nom_mere_P} onChange={(e) => set("nom_mere_P", e.target.value)} />
      <input placeholder="Téléphone (10 chiffres)" value={valeur.tel_P} onChange={(e) => set("tel_P", e.target.value)} />
      <label>
        <input type="checkbox" checked={valeur.proprietaire_P}
          onChange={(e) => set("proprietaire_P", e.target.checked)} /> Propriétaire
      </label>
      <select value={valeur.profession} onChange={(e) => set("profession", e.target.value)}>
        <option value="">Profession</option>
        {professions.map((p) => <option key={p.id} value={p.id}>{p.nom ?? p.id}</option>)}
      </select>
      <select value={valeur.nationalite} onChange={(e) => set("nationalite", e.target.value)}>
        <option value="">Nationalité</option>
        {nationalites.map((n) => <option key={n.id} value={n.id}>{n.nom_N ?? n.id}</option>)}
      </select>
      <input type="email" placeholder="Email (optionnel)" value={valeur.email} onChange={(e) => set("email", e.target.value)} />
      <input type="password" placeholder="Mot de passe (optionnel)" value={valeur.mot_de_passe} onChange={(e) => set("mot_de_passe", e.target.value)} />
    </fieldset>
  );


}