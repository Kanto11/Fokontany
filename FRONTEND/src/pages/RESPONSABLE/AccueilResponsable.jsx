import { useEffect,useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import retard from "../../assets/Icons/warning.png";

const MOIS_COURT = ["janv." ,"fev." , "mars" ,"avr." ,"mai" ,"juin" , "juil." ,"aout" ,"sept." ,"oct." ,"nov." ,"dec."]

const nomMois = new Date().toLocaleString('fr-FR',{month : 'long'})

const ar = (n) => `${Number(n).toLocaleString("fr-FR")} `;

export default function AccueilResponsable(){
  const [resultats,setResultats] = useState(null)
  const [erreur, setErreur] = useState("")
  

    useEffect(() => {
      api.get("/dashboard/responsable/")
      .then(({data}) => {setResultats(data)
      console.log("Données reçues de l'API :", data)})
      .catch(() => setErreur("Impossible de charger le dashboard"))
    },[])

    if (!resultats) return<p>Chargement...</p>
    const max = Math.max(...resultats.graphique.map((g)=>g.total),1)
  return(
    <>
      <div className="dashboard">
        <div className="wrapper__resp">
          <div className="dashboard__containers">
            <div className="dashboard__compteurs">
                <div className="card__compteurs">
                    
                    <label htmlFor="" className="compteurs__values stat__valeur">{resultats.compteurs?.familles ?? 0}</label>
                    <div className="compteurs__head">
                      <label htmlFor="" className="compteurs__info stat__info">Nombres de famille</label>
                    </div>
                    
                </div>
                <div className="card__compteurs compteurs__retard">
                    <div className="retards__img">
                        <img src={retard} alt="" />
                    </div>
                    <label htmlFor="" className="compteurs__values stat__valeur">{resultats.compteurs?.en_retard ?? 0}</label>
                    <div className="compteurs__head">
                      <label htmlFor="" className="compteurs__info stat__info" >Famille en retard</label>
                  </div>
                    
                </div>
                <div className="card__compteurs">
                 
                    <label htmlFor="" className="compteurs__values stat__valeur">Ar {resultats.compteurs?.encaisse_mois ?? 0} </label>
                  <div className="compteurs__head residences__statD">
                      <label htmlFor="" className="compteurs__info stat__info">Encaissé ce mois</label>
                      <span htmlFor="" className="compteurs__values ">{nomMois}</span>
                  </div>

                </div>
                <div className="card__compteurs">
                  
                    <label htmlFor="" className="compteurs__values stat__valeur">{resultats.compteurs?.residences_a_traiter ?? 0} </label>
                    <div className="compteurs__head residences__statD">
                      <label htmlFor="" className="compteurs__info stat__info">Residences à traiter</label>
                      <span htmlFor="" className="compteurs__values ">{resultats.compteurs?.residences_a_payer ?? 0}  residences à payer</span>
                  </div>
                    
                </div>
            </div>
            <div className="dashboard__body">
              <div className="dashboard__left grapique_card">
                <h3>Cotisations encaissées</h3>
                <span style={{color:"#94a3b8"}}>(6 derniers mois)</span>
                <div className="dash__left1 grapique_card">
                  {resultats.graphique.map((g) => (
                      <div key={`${g.annee}-${g.mois}`} className="graphique">
                          <span>{g.total ? ar(g.total) : "—"}</span>
                          <div className="grapique_txt">
                              <div
                       style={{ width: "100%", height: `${(g.total / max) * 100}%`, minHeight: 2 }} className="graphique__bare" />
                          </div>
                          
                          <div><span className="text-xs mt-1">{MOIS_COURT[g.mois - 1]}</span></div>
                    </div>
                    
                  ))}
                </div>
              </div>
              <div className="dashboard__center grapique_card">
                <p>center</p>
              </div>
              <div className="dashboard__right grapique_card">
                <p>pub</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}