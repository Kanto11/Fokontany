import { useEffect,useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import retard from "../../assets/Icons/warning.png";
const nomMois = new Date().toLocaleString('fr-FR',{month : 'long'})
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
          </div>
        </div>
      </div>
    </>
  )
}