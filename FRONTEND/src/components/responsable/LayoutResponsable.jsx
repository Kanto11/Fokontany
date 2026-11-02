import {NavLink ,Outlet ,  useNavigate, useLocation} from "react-router-dom"
import dashboard from "../../assets/Icons/dashboard.png"
import user from "../../assets/Icons/user.png"
import file from "../../assets/Icons/file.png"
import chat from "../../assets/Icons/message-bubbles.png"
import publication from "../../assets/Icons/advertising.png"
import cotisation from "../../assets/Icons/dollar.png"
import Profil from "../Profil";
import logos from "../../assets/Images/Logos.png";


const LIENS = [
  { chemin: "/responsable", texte: "Dashboard", icone: dashboard, exact: true },
  { chemin: "/responsable/carnets", texte: "Habitant", icone: user },
  { chemin: "/responsable/residences", texte: "Résidence", icone: file },
  { chemin: "/responsable/cotisations", texte: "Cotisation", icone: cotisation },
  { chemin: "/responsable/messages", texte: "Messages", icone: chat },
  { chemin: "/responsable/publications", texte: "Publications", icone: publication },
];


export default function LayoutResponsabe(){
    const navigate =  useNavigate()
    const { pathname } = useLocation();
    const actif = LIENS.find((l) =>
    l.exact ? pathname === l.chemin : pathname.startsWith(l.chemin)
    );

    function deconnexion(){
        localStorage.clear();
        navigate("/");
    }

    return (
        <div className="responsable">
            <div className="resp__left">
                <div className="resp__left__header">
                     <div className="logos">
                        <div className="img__logos">
                            <img src={logos} alt="" />
                        </div>
                        <div className="text__logos">
                            <span className="fkt">Fkt</span>
                            <span className="logos__lieu">Andohamandry</span>
                        </div>
                    </div>
                    <h5 className="espace">Espace Responsable</h5>
                    <div className="barre_resp"></div>
                </div>
               <div className="resp__left__nav">
                    <nav>
                        {LIENS.map((l) => (
                        <NavLink key={l.chemin} to={l.chemin} end={l.exact} className="resp-nav">
                                <img src={l.icone} alt="" />
                                <span>{l.texte}</span>
                        </NavLink>
                        ))}
                    </nav>
                </div>
                <div className="resp__left__footer">
                        <span>Site officiel fkt V.1.1</span>
                </div>
            </div>
            <div className="resp__right">
                <div className="resp__right_header">
                    <div className="right__header__title">
                            <p>{actif?.texte}</p>
                    </div>
                    <div className="right__header__connexion">
                        <Profil />
                        <button className="deconnexion_resp" onClick={deconnexion}>Se déconnecter</button>
                    </div>

                </div>
                <div className="resp__right__body">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}