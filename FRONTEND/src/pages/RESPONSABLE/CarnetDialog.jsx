import { useEffect, useRef, useState } from "react";
import api from "../../api";
import ajouter from "../../assets/Icons/plus.png";
import fermerImg from "../../assets/Icons/cross.png";
const parentVide ={
  nom_P : "" , prenom_P : "" ,date_nais_P : "" ,lieu_nais_P :"", nom_pere_P : "", nom_mere_P: "" , prof_P :"" ,tel_P : "",nationalite_P :"", proprietaire_P : false , email_P : "" , mdp_P :"" ,mdp_verif_P : "" , Cin_P : " ",date_delivrence_P : "" ,lieu_delivrence_P : "" , Passport :"" , date_expiration :"", photo: null}

const enfantVide = {
  nom_Ef: "", prenom_Ef: "", date_nais_Ef: "", lieu_nais_Ef: "",
  nationalite: "", profession: "", photo: null,
};

export default function CarnetDialog({ onCreated }) {
  const dialogRef = useRef(null);     
  const ouvrir = () => dialogRef.current.showModal();
  const fermer = () => {
  if (dialogRef.current) {
    dialogRef.current.close();
    }
  
    setPere({ ...parentVide });
    setMere({ ...parentVide });
    setAdresseH("");
    setEnfants([]);
    setLeserreursHab({});
};


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
  const [pere , setPere] = useState(parentVide);
  const [mere , setMere] = useState(parentVide);
  const [leserreursHab , setLeserreursHab] = useState({})
  const [erreurLogHab,setErreurLogHab] = useState("");
  const [enfants, setEnfants] = useState([]);
  const [erreurs, setErreurs] = useState(null);
  const [erreursChef, setErreursChef] = useState("");

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
    if (!adresseH.trim()){
      lesErreurs.adresseH = "L'adresse est obligatoire";
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

   function verifieAge(dateNaissance){
      if(!dateNaissance) return false

      const  naissance = new Date(dateNaissance)
      const aujourdhui = new Date

      let age = aujourdhui.getFullYear() - naissance.getFullYear();
      const mois = aujourdhui.getMonth() - naissance.getMonth();
      if(mois < 0 || (mois === 0 && aujourdhui.getDate() < naissance.getDate())){
          age--;
      }
      return age >= 15 && age <= 110;
    }

  const ajouterEnfant = () => setEnfants([...enfants, { ...enfantVide }]);
  const changerEnfant = (i, champ, valeur) =>
    setEnfants(enfants.map((e, idx) => (idx === i ? { ...e, [champ]: valeur } : e)));
  const retirerEnfant = (i) => setEnfants(enfants.filter((_, idx) => idx !== i));
  const nettoyerParent = (p) => {
    if (!p?.nom_P?.trim()) return null;

    const nationalite = Number(p.nationalite_P);
    const parent = {
      nom_P: p.nom_P.trim(),
      prenom_P: p.prenom_P,
      date_nais_P: p.date_nais_P,
      lieu_nais_P: p.lieu_nais_P,
      nom_pere_P: p.nom_pere_P,
      nom_mere_P: p.nom_mere_P,
      tel_P: p.tel_P,
      proprietaire_P: Boolean(p.est_proprietaire),
      profession: Number(p.profession_id),
      nationalite,
    };

    if (p.email_P && p.mdp_P) {
      parent.email = p.email_P.trim();
      parent.mot_de_passe = p.mdp_P;
    }

    if (nationalite === 1 || nationalite === 2) {
      parent.piece = {
        type_piece: nationalite === 1 ? "CIN" : "PASSPORT",
        numero: nationalite === 1 ? p.Cin_P.trim() : p.Passport.trim(),
        date_delivrance: p.date_delivrence_P || null,
        lieu_delivrance: p.lieu_delivrence_P?.trim() || "",
        date_expiration: nationalite === 2 ? p.date_expiration || null : null,
      };
    }

    return parent;
  };

   const btnvalideHabitant = async(e) => {
      e.preventDefault()
      setLeserreursHab({});
      setErreurs(null);
      setErreurLogHab("");

      if (!logementId) {
        setErreurLogHab("Veuillez lier un logement valide.");
        return;
      }

      let lesErreurs_locales = {};
      const aujourdhuiStr = new Date().toISOString().split("T")[0];
      const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/

    //------------champ nom
    if ((!mere?.nom_P) && (!pere?.nom_P)){
      setErreursChef("Chef de famille obligatoire");
      lesErreurs_locales.mere_nom_p = "Le nom  est obligatoire ";
      lesErreurs_locales.pere_nom_p = "Le nom  est obligatoire "
    } 

      //-----------pere
      if(pere?.nom_P){
        if (!verifieAge(pere.date_nais_P)){
        lesErreurs_locales.pere_date_nais = "Age du parent devrait etre entre 15-110 ans "
        }
        if (!pere.tel_P || pere.tel_P.length > 10 || pere.tel_P.length < 10){
          lesErreurs_locales.pere_tel_p = "Telepehone est obligatoire et avec 10 chiffres"
        }
        if (!pere.lieu_nais_P){
            lesErreurs_locales.pere_lieu_nais_p = "Lieu de naissance obligatoire"
          }

        if (!pere.nationalite_P) { 
            lesErreurs_locales.pere_nationalite_p = "La nationalité du père est obligatoire";
          }else{
        
            if (String(pere.nationalite_P) === "1") {
              const cinRegex = /^\d{12}$/; 
              if (!pere.Cin_P || !pere.Cin_P.trim()) {
                lesErreurs_locales.pere_cin = "Le numéro de CIN est obligatoire";
              } else if (!cinRegex.test(pere.Cin_P.trim())) {
                lesErreurs_locales.pere_cin = "Le CIN doit contenir exactement 12 chiffres";
              }

              if (!pere.date_delivrence_P) {
                lesErreurs_locales.pere_date_cin = "La date de délivrance est obligatoire";
              } else if (pere.date_delivrence_P > aujourdhuiStr) {
                lesErreurs_locales.pere_date_cin = "La date de délivrance ne peut pas être dans le futur";
              }

              if (!pere.lieu_delivrence_P || !pere.lieu_delivrence_P.trim()) {
                lesErreurs_locales.pere_lieu_cin = "Le lieu de délivrance est obligatoire";
              }
            }

            if (String(pere.nationalite_P) === "2") {
              const passportRegex = /^[A-Za-z0-9]{5,9}$/;
              if (!pere.Passport || !pere.Passport.trim()) {
                lesErreurs_locales.pere_passport = "Le numéro de passeport est obligatoire";
              } else if (!passportRegex.test(pere.Passport.trim())) {
                lesErreurs_locales.pere_passport = "Le passeport doit contenir entre 5 et 9 lettres ou chiffres";
              }

              if (!pere.date_expiration) {
                lesErreurs_locales.pere_date_exp = "La date d'expiration est obligatoire";
              } else if (pere.date_expiration <= aujourdhuiStr) {
                lesErreurs_locales.pere_date_exp = "La date d'expiration doit être dans le futur";
              }
            }
          }

        if (!pere.profession_id){
              lesErreurs_locales.pere_prof_P = "Profession obligatoire";

            }
        if (!pere.email_P || !pere.email_P.trim()){
            lesErreurs_locales.pere_email_P = "Email obligatoire";
          }else if(!emailRegex.test(pere.email_P)){
            lesErreurs_locales.pere_email_P = "Email invalide (exemple@gmail.com)";
          }

        if(!pere.mdp_P){
            lesErreurs_locales.pere_mdp_P="mot de passe obligatoire"
          } else if (pere.mdp_P.length < 8) {
            lesErreurs_locales.pere_mdp_P="Le mot de passe doit contenir au moins 8 caractères"
          }

        if(!pere.mdp_verif_P){
            lesErreurs_locales.pere_mdp_verif_P="Confirmation obligatoire"
          }else if(String(pere.mdp_verif_P) !== String(pere.mdp_P)){
              lesErreurs_locales.pere_mdp_verif_P="Les mots de passe ne correspond pas  "
              console.log(pere.mdp_P)
          }
      }

      //----------mere
      if(mere?.nom_P){
        if (!verifieAge(mere.date_nais_P)) {
        lesErreurs_locales.mere_date_nais = "Age du parent devrait etre entre 15-110 ans";
        }

        if (!mere.tel_P || mere.tel_P.length > 10 || mere.tel_P.length < 10){
          lesErreurs_locales.mere_tel_p = "Telephone est obligatoire et avec 10 chiffres"
        }
        if (!mere.lieu_nais_P){
            lesErreurs_locales.mere_lieu_nais_p = "Lieu de naissance obligatoire"
        }

        if (!mere.nationalite_P) {
              lesErreurs_locales.mere_nationalite_p = "La nationalité de la mère est obligatoire";
            }else {
                if (String(mere.nationalite_P) === "1") {
                  const cinRegex = /^\d{12}$/;
                  if (!mere.Cin_P || !mere.Cin_P.trim()) {
                    lesErreurs_locales.mere_cin = "Le numéro de CIN est obligatoire";
                  } else if (!cinRegex.test(mere.Cin_P.trim())) {
                    lesErreurs_locales.mere_cin = "Le CIN doit contenir exactement 12 chiffres";
                  }

                  if (!mere.date_delivrence_P) {
                    lesErreurs_locales.mere_date_cin = "La date de délivrance est obligatoire";
                  } else if (mere.date_delivrence_P > aujourdhuiStr) {
                    lesErreurs_locales.mere_date_cin = "La date de délivrance ne peut pas être dans le futur";
                  }

                  if (!mere.lieu_delivrence_P || !mere.lieu_delivrence_P.trim()) {
                    lesErreurs_locales.mere_lieu_cin = "Le lieu de délivrance est obligatoire";
                  }
                }

                if (String(mere.nationalite_P) === "2") {
                    const passportRegex = /^[A-Za-z0-9]{5,9}$/;
                    if (!mere.Passport || !mere.Passport.trim()) {
                      lesErreurs_locales.mere_passport = "Le numéro de passeport est obligatoire";
                    } else if (!passportRegex.test(mere.Passport.trim())) {
                      lesErreurs_locales.mere_passport = "Le passeport doit contenir entre 5 et 9 lettres ou chiffres";
                    }

                    if (!mere.date_expiration) {
                      lesErreurs_locales.mere_date_exp = "La date d'expiration est obligatoire";
                    } else if (mere.date_expiration <= aujourdhuiStr) {
                      lesErreurs_locales.mere_date_exp = "La date d'expiration doit être dans le futur";
                    }
                }
      
            }

        if (!mere.profession_id){
              lesErreurs_locales.mere_prof_p = "Profession obligatoire";

            }

        if (!mere.email_P){
            lesErreurs_locales.mere_email_P = "Email obligatoire";
          }else if(!emailRegex.test(mere.email_P)){
            lesErreurs_locales.mere_email_P = "Email invalide (exemple@gmail.com)";
          }

        if (!mere.mdp_P){
            lesErreurs_locales.mere_mdp_P="mot de passe obligatoire"
          } else if (mere.mdp_P.length < 8) {
            lesErreurs_locales.mere_mdp_P="Le mot de passe doit contenir au moins 8 caractères"
          }

        if(!mere.mdp_verif_P){
            lesErreurs_locales.mere_mdp_verif_P="Confirmation obligatoire"
          }else if(String(mere.mdp_verif_P) !== String(mere.mdp_P)){
              lesErreurs_locales.mere_mdp_verif_P="Les mots de passe ne correspond pas  "
          }
      }
      

      if (Object.keys(lesErreurs_locales).length > 0) {
        setLeserreursHab(lesErreurs_locales);
        return; 
      }

      try{

  
          const perePayload = nettoyerParent(pere);
          const merePayload = nettoyerParent(mere);
          const payload = {
        logement: Number(logementId),
        ...(perePayload && { pere: perePayload }),
        ...(merePayload && { mere: merePayload }),
        enfants: enfants.map((en) => ({
          nom_Ef: en.nom_Ef,
          prenom_Ef: en.prenom_Ef,
          date_nais_Ef: en.date_nais_Ef,
          lieu_nais_Ef: en.lieu_nais_Ef,
          nationalite: Number(en.nationalite),
          profession: en.profession ? Number(en.profession) : null,
        })),
        };
        const { data } = await api.post("/carnets/", payload);
        const photosAEnvoyer = [];

        if (perePayload?.photo && data.pere) {
          photosAEnvoyer.push([`/parents/${data.pere}/photo/`, perePayload.photo]);
        }
        if (merePayload?.photo && data.mere) {
          photosAEnvoyer.push([`/parents/${data.mere}/photo/`, merePayload.photo]);
        }
        enfants.forEach((enfant, index) => {
          if (enfant.photo && data.enfants?.[index]) {
            photosAEnvoyer.push([`/enfants/${data.enfants[index]}/photo/`, enfant.photo]);
          }
        });

        const resultatsPhotos = await Promise.allSettled(
          photosAEnvoyer.map(([url, fichier]) => {
            const formData = new FormData();
            formData.append("photo", fichier);
            return api.post(url, formData);
          })
        );
        const erreursPhotos = resultatsPhotos
          .filter((resultat) => resultat.status === "rejected")
          .map((resultat) => resultat.reason.response?.data?.photo?.[0]
            || resultat.reason.response?.data?.detail
            || resultat.reason.message);

        if (erreursPhotos.length) {
          console.error("Le carnet est créé, mais certains uploads photo ont échoué :", erreursPhotos);
        }

        fermer();
        api.get("/logements/")
          .then(({ data: logementsActualises }) => setLogements(logementsActualises))
          .catch((error) => console.error("Impossible d'actualiser les logements :", error));
        onCreated?.(data, erreursPhotos);      
      } catch (error) {
      const details = error.response?.data ?? { detail: error.message || "Erreur réseau pendant l'enregistrement." };
      console.error("Échec de création du carnet :", {
        status: error.response?.status,
        data: details,
        payload: error.config?.data,
      });
      setErreurs(details);
    }
  }; 


  return(
    <>
      <button onClick={ouvrir}>+ Nouveau carnet</button>

      <dialog ref={dialogRef}>
        <form className="carnetDialog" onSubmit={btnvalideHabitant}>
          <div className="btn__fermer" onClick={fermer} type="button">
            <img src={fermerImg} alt="" />
          </div>
          <h2>Nouveau carnet</h2>
          {erreurs && (
            <pre role="alert" style={{ color: "red", whiteSpace: "pre-wrap" }}>
              {typeof erreurs === "string" ? erreurs : JSON.stringify(erreurs, null, 2)}
            </pre>
          )}

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
            {erreurLogHab && <p style={{ color: "red" }}>{erreurLogHab}</p>}
            
            <button className="btn__ajouter" type="button" onClick={ouvrirLog}>
              <img src={ajouter} alt="" />
              <span>Nouveau logement</span>
            </button>
          </div>
          <div className="parent__ajout">
              <ParentFields titre="Père" professions= {professions} nationalites={nationalites} valeur={pere} 
              onChange={setPere}  erreurAge={leserreursHab.pere_date_nais} erreurTel = {leserreursHab.pere_tel_p}
              erreurNom = {leserreursHab.pere_nom_p} erreurLieuNais = {leserreursHab.pere_lieu_nais_p}
              erreurNationalite={leserreursHab.pere_nationalite_p}
              erreurCin={leserreursHab.pere_cin} erreurDateCin={leserreursHab.pere_date_cin} erreurLieuCin={leserreursHab.pere_lieu_cin} erreurPassport={leserreursHab.pere_passport} erreurDateExp={leserreursHab.pere_date_exp} erreurProf={leserreursHab.pere_prof_p}
              erreurEmail={leserreursHab.pere_email_P} erreurMdp={leserreursHab.pere_mdp_P} erreurMdpVerif={leserreursHab.pere_mdp_verif_P}
             />
              <ParentFields titre="Mère" professions= {professions} nationalites={nationalites} valeur={mere} 
              onChange={setMere} erreurAge={leserreursHab.mere_date_nais} erreurTel = {leserreursHab.mere_tel_p}
              erreurNom = {leserreursHab.mere_nom_p} erreurLieuNais = {leserreursHab.mere_lieu_nais_p}
              erreurNationalite={leserreursHab.mere_nationalite_p}
              erreurCin={leserreursHab.mere_cin} erreurDateCin={leserreursHab.mere_date_cin} erreurLieuCin={leserreursHab.mere_lieu_cin} erreurPassport={leserreursHab.mere_passport} erreurDateExp={leserreursHab.mere_date_exp} erreurProf={leserreursHab.mere_prof_p}
              erreurEmail={leserreursHab.mere_email_P} erreurMdp={leserreursHab.mere_mdp_P} erreurMdpVerif={leserreursHab.mere_mdp_verif_P}/> 
          </div>

          <div className="enfants">
            <h3>Enfant</h3>
              {enfants.map((en, i) => (
              <fieldset key={i}>
                <legend>Enfant N°{i + 1}</legend>
                <input placeholder="Nom" value={en.nom_Ef}
                  onChange={(e) => changerEnfant(i, "nom_Ef", e.target.value)} required />
                <input placeholder="Prénom" value={en.prenom_Ef}
                  onChange={(e) => changerEnfant(i, "prenom_Ef", e.target.value)} required />
                <input type="date" value={en.date_nais_Ef}
                  onChange={(e) => changerEnfant(i, "date_nais_Ef", e.target.value)} required />
                <input placeholder="Lieu de naissance" value={en.lieu_nais_Ef}
                  onChange={(e) => changerEnfant(i, "lieu_nais_Ef", e.target.value)} required />
                <label>Photo de l'enfant :</label>
                <input type="file" accept="image/*"
                  onChange={(e) => changerEnfant(i, "photo", e.target.files?.[0] || null)} />

                <label>Nationalité :</label>
                <select value={en.nationalite}
                  onChange={(e) => changerEnfant(i, "nationalite", e.target.value)} required>
                  <option value="">Nationalité</option>
                  {nationalites.map((n) => <option key={n.id} value={n.id}>{n.nationalite ?? n.id}</option>)}
                </select>
                <label>Profession :</label>
                <select value={en.profession} onChange={(e) =>changerEnfant(i,"profession",e.target.value)} required>
                  <option value="">Profession</option>
                  {professions.map((p) => <option key={p.id} value={p.id}>{p.nom_Prof ?? p.id}</option>)}
                </select>
                <button type="button" onClick={() => retirerEnfant(i)}>Retirer</button>
              </fieldset>
            ))}
            <button type="button" onClick={ajouterEnfant} className="ajouter__enfant">+ Ajouter un enfant</button>

          </div>

            <p style={{color:"red" ,size:"1rem"}}>{erreursChef} </p>
          <div className="btn__carnetDialog btn__action">
              <button className="btn__valider" type="submit">Valider</button>
              <button onClick={fermer} className="btn__annuler" type="button">Annuler</button>
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
function ParentFields({ titre, professions = [], nationalites = [], valeur, onChange ,erreurAge , 
  erreurTel ,erreurNom ,erreurLieuNais ,erreurNationalite ,
  erreurCin, erreurDateCin, erreurLieuCin, erreurPassport, erreurDateExp,erreurProf,erreurMdp,erreurMdpVerif,erreurEmail}) {

  if (!valeur) return null; 

  const set = (champ, v) => {
    if (onChange) onChange({ ...valeur, [champ]: v });
  };

  return (
    <fieldset>
      <legend>{titre}</legend>
      <label htmlFor="">Nom :</label>
      <input type="text" value={valeur.nom_P || ""} onChange={(e) => set("nom_P", e.target.value)} />
      {erreurNom && <p style={{ color: "red" }}>{erreurNom}</p>}

      <label htmlFor="">Prénom :</label>
      <input type="text" value={valeur.prenom_P || ""} onChange={(e) => set("prenom_P", e.target.value)} />

      <label htmlFor="">Date de naissance :</label>
      <input type="date" value={valeur.date_nais_P || ""} onChange={(e) => set("date_nais_P", e.target.value)} />
      {erreurAge && <p style={{ color: "red" }}>{erreurAge}</p>}

      <label htmlFor="">Lieu de naissance :</label>
      <input type="text" value={valeur.lieu_nais_P || ""} onChange={(e) => set("lieu_nais_P", e.target.value)} />
      {erreurLieuNais && <p style={{ color: "red" }}>{erreurLieuNais}</p>}

      <label>Nom du père :</label>
      <input type="text" value={valeur.nom_pere_P || ""} onChange={(e) => set("nom_pere_P", e.target.value)} />

      <label htmlFor="">Nom de la mère</label>
      <input type="text" value={valeur.nom_mere_P || ""} onChange={(e) => set("nom_mere_P", e.target.value)} />

      <label htmlFor="">Photo</label>
      <input type="file" accept="image/*"
        onChange={(e) => set("photo", e.target.files?.[0] || null)} />

      <label htmlFor="">Téléphone : (10 Chiffres)</label>
      <input type="text"  value={valeur.tel_P || ""} onChange={(e) => set("tel_P", e.target.value)} />
      {erreurTel && <p style={{ color: "red" }}>{erreurTel}</p>}

      <div className="parent__nationalites">
        <label htmlFor="">Nationalités :</label>
        <select value={valeur.nationalite_P || ""} onChange={(e) => set("nationalite_P", e.target.value)}>
          <option value="">--Choisir--</option>
          {nationalites.map((n) => (
            <option key={n.id} value={n.id}>{n.nationalite ?? n.id}</option>
          ))}
        </select>
        {erreurNationalite && <p style={{ color: "red" }}>{erreurNationalite}</p>}
        
      </div>

     

      <div className="origine__parent">
            
            {String(valeur.nationalite_P) === "1" && (
              <div className="parent__identite__CIN">
                <label htmlFor=""> N Cin:</label>
                <input type="text" value={valeur.Cin_P || ""} onChange={(e) => set("Cin_P", e.target.value)} />
                {erreurCin && <p style={{ color: "red" }}>{erreurCin}</p>}

                <label htmlFor="">Date de délivrance :</label>
                <input type="date" value={valeur.date_delivrence_P || ""} onChange={(e) => set("date_delivrence_P", e.target.value)} />
                {erreurDateCin && <p style={{ color: "red" }}>{erreurDateCin}</p>}
                
                <label htmlFor="">Lieu de délivrance :</label>
                <input type="text" value={valeur.lieu_delivrence_P || ""} onChange={(e) => set("lieu_delivrence_P", e.target.value)} />
                {erreurLieuCin && <p style={{ color: "red" }}>{erreurLieuCin}</p>}
              </div>
            )}

            
            {String(valeur.nationalite_P) === "2" && (
              <div className="parent__identite__Passport">
                <label htmlFor="">N Passport :</label>
                <input type="text" value={valeur.Passport || ""} onChange={(e) => set("Passport", e.target.value)} />
                {erreurPassport && <p style={{ color: "red" }}>{erreurPassport}</p>}
                
                <label htmlFor="">Date de délivrance</label>
                <input type="date" value={valeur.date_delivrence_P || ""} onChange={(e) => set("date_delivrence_P", e.target.value)} />

                <label htmlFor="">Lieu de délivrance</label>
                <input type="text" value={valeur.lieu_delivrence_P || ""} onChange={(e) => set("lieu_delivrence_P", e.target.value)} />

                <label htmlFor="">Date d'expiration</label>
                <input type="date" value={valeur.date_expiration || ""} onChange={(e) => set("date_expiration", e.target.value)} />
                 {erreurDateExp && <p style={{ color: "red" }}>{erreurDateExp}</p>}
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
            {erreurProf && <p style={{ color: "red" }}>{erreurProf}</p>}
          </div>

          <div className="parent__compte">
            <label htmlFor="">Email :</label>
            <input type="text" value={valeur.email_P || ""} onChange={(e) => set("email_P", e.target.value)} />
            {erreurEmail && <p style={{ color: "red" }}>{erreurEmail}</p>}
            <label htmlFor="">Mot de passe</label>
            <input type="password" value={valeur.mdp_P || ""} onChange={(e) => set("mdp_P", e.target.value)} />
            {erreurMdp && <p style={{ color: "red" }}>{erreurMdp}</p>}
            <label htmlFor="">Confirmation mot de passe</label>
            <input type="password" value={valeur.mdp_verif_P || ""} onChange={(e) => set("mdp_verif_P", e.target.value)} />
            {erreurMdpVerif && <p style={{ color: "red" }}>{erreurMdpVerif}</p>}
          </div>
      </fieldset>
  );
}

