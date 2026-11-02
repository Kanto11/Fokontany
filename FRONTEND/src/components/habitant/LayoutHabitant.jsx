import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import logos from "../../assets/Images/logos.png";
import Profil from "../Profil";
import Home from "../../assets/Icons/home.png";
import cotisation from "../../assets/Icons/dollar.png";
import file from "../../assets/Icons/file.png";
import user from "../../assets/Icons/user.png";

const LIENS = [
  { chemin: "/habitant", texte: "Home", icone: Home, exact: true },
  { chemin: "/habitant/residences", icone: file, texte: "Résidence" },
  { chemin: "/habitant/cotisations", icone: cotisation, texte: "Cotisation" },
  { chemin: "/habitant/apropos", icone: user, texte: "Vous" },
];

export default function LayoutHabitant() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    function deconnexion() {
        localStorage.clear();
        navigate("/");
    }

    return (
        <div className="habitant">
            <div className="habitant__headers">
                <div className="wrapper">
                    <div className="habitant__headers__containt">
                        
                      
                        <div className="habitant__headers__logos">
                            <div className="logos logos__habitant">
                                <div className="img__logos">
                                    <img src={logos} alt="" />
                                </div>
                                <div className="text__logos">
                                    <span className="fkt">Fkt</span>
                                    <span className="logos__lieu">Andohamandry</span>
                                </div>
                            </div>
                            <div className="right__header__connexion">
                                <Profil />
                            </div>
                        </div>

                    
                        <div className="habitant__headers__footer">
                            <div className="habitant__header__nav">
                                <nav>
                                    {LIENS.map((l) => (
                                        <NavLink key={l.chemin} to={l.chemin} end={l.exact} className="hab-nav">
                                            <img src={l.icone} alt="" />
                                            <span>{l.texte}</span>
                                        </NavLink>
                                    ))}
                                </nav>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

         
            <main className="habitant__main-content">
                <Outlet />
            </main>
        </div>
    );
}
