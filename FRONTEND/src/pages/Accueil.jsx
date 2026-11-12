import {useState} from "react"
import { Link } from "react-router-dom";
import burger from "../assets/Icons/burger-icon.svg"
import bureau from "../assets/Images/Bureau.png";
import logos from "../assets/Images/logos.png";
import comptable from "../assets/Images/comptable.jpg";
import histoire from "../assets/Images/histoire.png";
import fleche from "../assets/Icons/fleche.png";
export default function Accueil(){
    const [openMenu,setOpenMenu] = useState(false)
    const [activeLink , setActivateLink] = useState("#apropos")

    const toggleMenu = () => {
        setOpenMenu(!openMenu);
    }

    const handleLinkClick = (link) =>{
        setActivateLink(link);
        setOpenMenu(false);
    }
    return(
        <main>
             <header className="header">
                <div className="wrapper">
                    <div className="header__container">
                        <div className="header__gauche">
                            <div className="burger__menu" onClick={toggleMenu}>
                                <img src={burger} alt=""/>
                            </div>
                             <div className="logos">
                                <div className="img__logos">
                                    <img src={logos} alt="" />
                                </div>
                                                            
                            </div>
                        </div>
                
                        <div className={`header__link ${openMenu ? 'open' : ''}`}>
                            <ul>
                                <li className={activeLink === "#apropos" ? "active" : ""}>
                                <a href="#apropos" onClick={() => handleLinkClick("#apropos")}>Apropos</a>
                                </li>
                                <li className={activeLink === "#histoire" ? "active" : ""}>
                                <a href="#histoire" onClick={() => handleLinkClick("#histoire")}>Historique</a>
                                </li>
                                <li className={activeLink === "#responsable" ? "active" : ""}>
                                <a href="#responsable" onClick={() => handleLinkClick("#responsable")}>Responsable</a>
                                </li>
                                <li className={activeLink === "#contact" ? "active" : ""}>
                                <a href="#contact" onClick={() => handleLinkClick("#contact")}>Contact</a>
                                </li>
                            </ul>
                    
                        </div>
                        
                        <div className="header__signup">
                            <Link to="/authentification" className="sign_up">Se connecter</Link>
                        </div>
                    </div>
                </div>
            </header>
    <div className="hero">
        <div className="hero__img">
            <img src={bureau} alt=""/>
        </div>
        <div className="hero__text">
            <div className="hero__titre">
                <p>Fokontany Andohamandry</p>
                <span>Site officiel du Fokontany</span>
            </div>
            <div className="hero__contact">
                <button className="hero__action">Nous contacter
                    <div>
                        <img src={fleche} alt=""/>
                    </div>
                    
                </button>
            </div>
        </div>
    </div>
    <section className="Verification__residence">
        <div className="wrapper">
            <div className="ver__res__container">
                <h2 className="section__title">Verification du residence</h2>
                <input type="text" placeholder="Numero de residence à verifier" />
                <a>Cliquer ici pour scanner..</a>
                <div className="header__signup">
                            <Link to="/verifier" className="sign_up">VERIFIER UN RESIDENCE</Link>
                </div>
            </div>
        </div>

    </section>
    <section className="apropos" id="apropos">
        <div className="wrapper">
            <div className="apropos__container">
                <div className="apropos__texte ">
                    <h2 className="section__title">A propos</h2>
                    <p>Le Fokontany d'Andohamandry, situé dans le deuxieme arrondissement d'Antananarivo, est un quartier à la fois historique et résidentiel de la capitale malgache.</p>
                </div>
                <div className="apropos__stat">
                    <div className="gril__stat">
                         <div className="stat__card card">
                            <p className="stat__valeur">1500m²</p>
                            <p className="stat__info">Largeur</p>
                        </div>
                        <div className="stat__card card">
                            <p className="stat__valeur">5</p>
                            <p className="stat__info">Nombre de secteur</p>
                        </div>
                    </div>
                   <div className="gril__stat">
                        <div className="stat__card card">
                            <p className="stat__valeur">150.000</p>
                            <p className="stat__info">Nombre des habitants</p>
                        </div>
                        <div className="stat__card card">
                            <p className="stat__valeur">150+</p>
                            <p className="stat__info">Nombre de secteur</p>
                        </div>
                   </div>
                     
                    
                </div>
               
            </div>
        </div>
    </section>
    <section className="histoire" id="histoire">
        <div className="wrapper">
            <div className="histoire__container">
                <div className="histoire__img">
                    <img src={histoire} alt=""/>
                </div>
                <div className="histoire__texte">
                    <h2 className="section__title">Historiques</h2>
                    <p>Fondé en 1976 sur les hauteurs du 2e Arrondissement d'Antananarivo, à proximité d'Ambohipotsy, le Fokontany d'Andohamandry s'impose aujourd'hui comme un modèle d'urbanisme et de civisme au sein de la capitale. Ce quartier résidentiel se distingue particulièrement par son calme préservé et la valorisation rigoureuse de la propriété privée et collective, offrant un cadre de vie sécurisé, propre et hors du tumulte du centre-ville.
                    </p>
                    <p>--</p>
                    <p>La force d'Andohamandry réside dans la dynamique de sa communication locale et ses activités communautaires régulées, qui associent technologies de proximité et comités de vigilance pour assurer une gestion transparente. Cette gouvernance participative et cet art de vivre exclusif font désormais de ce fokontany une référence inspirante et particulièrement attractive pour les résidents des autres secteurs de la ville.</p>
                </div>
            </div>
        </div>
    </section>
    <section className="responsable" id="responsable">
        <div className="wrapper">
            <div className="responsable__container">
                <div className="responsable__texte ">
                        <h2 className="section__title">Responsable</h2>
                </div>
                <div className="responsable__card">
                    <div className="agent__resp card">
                        <div className="agent__img">
                            <img src={comptable} alt=""/>
                        </div>
                        <div className="agent__info">
                            <p>Chef de quartier</p>
                            <p>RADOTIANA Michel</p>
                        </div>  
                    </div>
                    <div className="agent__resp card">
                        <div className="agent__img">
                            <img src={comptable} alt=""/>
                        </div>
                        <div className="agent__info">
                            <p>Secretaire</p>
                            <p>RAVAO Marie</p>
                        </div>  
                    </div>
                    <div className="agent__resp card">
                        <div className="agent__img">
                            <img src={comptable} alt=""/>
                        </div>
                        <div className="agent__info">
                            <p>Comptable</p>
                            <p>RANDRIA Tsinjo</p>
                        </div>  
                    </div>
                </div>
                
            </div>
        </div>
    </section>
        </main>
    );
}