
import {useState} from "react"
import auth_img from  "../assets/Images/Rova.jpg"
import viewbtn from  "../assets/Icons/view.png"
import visible from  "../assets/Icons/visible.png"

import api from "../api"
import {useNavigate} from "react-router-dom"

export default function Authentification(){
    const [type , setType] = useState("HABITANT");
    const [email , setEmail] = useState("");
    const [motDePasse , setMotDePasse] =useState("");
    let [erreur , setErreur] = useState("");
    const [chargement , setChargement] = useState(false);
    const navigate = useNavigate();

    //Toggle
    const [showmdp , setshowmdp] = useState(false);
    const togglemdpvisible = () => {
        setshowmdp(!showmdp);
    };

    async function envoyer(e){
        e.preventDefault();
        setErreur("")
        setChargement(true);
        try {
            const {data} = await api.post("/auth/login/" , { type , email , mot_de_passe : motDePasse});
            localStorage.setItem("access", data.access);
            localStorage.setItem("refresh" ,data.refresh);
            localStorage.setItem("type" ,data.type);
            navigate(data.type === "RESPONSABLE" ? "/responsable" : "/habitant");
            
        }catch (err){
            if (err.response .status === 401) 
                setErreur("Identifiants incorrectes .");
            else if (err.response?.status === 429)
                setErreur("Trop de tentative , ressaie dans une minute");
            else setErreur("Impossible de joindre le serveur");
        }finally{
            setChargement(false);
        }
    }


    return(
        <main>
            <div className="authentification">
                    <div className="authentification__container ">
                        <div className="auth__img">
                                <img src={auth_img} alt="" />
                        </div>
                        <div className="auth__text">
                            <div className="authentification__header">
                                <div className="logos">
                                    <span className="fkt">Fkt</span>
                                    <span className="logos__lieu">Andohamandry</span>
                                </div>
                                <h3 className="auth__title">
                                Page d'authentification
                                </h3>
                            </div>
                            <form onSubmit={envoyer}>
                                <div className="authentification__body">
                                    <div className="auth__champ">
                                        <label htmlFor="">Type :</label>
                                        <select name="" id="" value={type} onChange={(e) => setType(e.target.value)}>
                                            <option value = "HABITANT">Habitant</option>
                                            <option value ="RESPONSABLE">Responsable</option>
                                        </select>
                                    </div>
                                    <div className="auth__champ">
                                        <label htmlFor="" >Email :</label>
                                        <input type ="email" value={email} required onChange={(e)=>setEmail(e.target.value)}/>
                                    </div>
                                    <div className="auth__champ">
                                        <label htmlFor="">Mot de passe : </label>
                                        <div className="password-wrapper">
                                             <input type={showmdp ? "text" : "password"} id="user_pswd" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
                                            <button  className="toggle-password" onClick={togglemdpvisible} aria-label={showmdp ? "Masquer le mot de passe" : "Afficher le mot de passe"} type="button">
                                                {showmdp ? <img src={viewbtn} alt="Afficher le mot de passe " /> :<img src={visible} alt="Masquer le mot de passe" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="auth__link">
                                    {erreur && <p style={{ color: "crimson" }}>{erreur}</p>}
                                    <button className="sign_up" type="submit" disabled={chargement}>{chargement ? "Connexion..." : "Se connecter"}</button>
                                    <button>Mot de passe oublié</button>
                                </div>
                            </form>
                           
                        </div>
                        
                    </div>
                       
            </div>
        </main>
    )
}