import {useEffect , useState} from "react";
import {useNavigate} from "react-router-dom";
import api from "../api"

export default function Profil(){
    const [moi,setMoi]= useState(null);
    const navigate =  useNavigate();

    useEffect(() =>{
        api.get("/moi/")
        .then(({data})=> setMoi(data))
        .catch(()=>{
            localStorage.clear();
            navigate("/authentification");
        });
    },[navigate]);

    if(!moi) return null;

    const initiales = `${moi.prenom?.[0]}${moi.nom?.[0] ?? ""}`.toUpperCase() || "?";
    return(
        <div className="profil">
            {moi.photo ? (<img className="photo__profile" src={moi.photo} alt="" />) : (<span className="profil__initiales">{initiales}</span>)}

            <div className="profil__texte">
                <span className="profil__nom">{moi.prenom}{moi.nom}</span>
                {moi.fonction && <span className="profil__fonction">{moi.fonction}</span>}
            </div>
        </div>
    )
}