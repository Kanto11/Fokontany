import { Link } from "react-router-dom";
import burger from "../assets/Icons/burger-icon.svg"
import photo from "../assets/Images/hero-right.jpg";
import fleche from "../assets/Icons/fleche.png";
export default function Accueil(){
    return(
        <main>
             <header className="header">
                <div className="wrapper">
                    <div className="header__container">
                        <div className="header__gauche">
                            <div className="burger__menu">
                                <img src={burger} alt=""/>
                            </div>
                            <div className="logos">
                                <span className="fkt">Fkt</span>
                                <span className="logos__lieu">Andohamandry</span>
                            </div>
                        </div>
                
                        <div className="header__link">
                            <ul>
                                <li className="active"><a href="#apropos">Apropos</a></li>
                                <li><a href="#histoire">Historique</a></li>
                                <li><a href="#responsable">Responsable</a></li>
                                <li><a href="#contact">Contact</a></li>
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
            <img src={photo} alt=""/>
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
    <section className="apropos" id="apropos">
        <div className="wrapper">
            <div className="apropos__container">
                <div className="apropos__texte ">
                    <h2 className="section__title">A propos</h2>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure nam quas voluptates non ratione dicta amet dolore illum, officia asperiores dolorum fuga provident beatae ad nulla dolorem ex, deserunt optio!</p>
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
                    <img src={photo} alt=""/>
                </div>
                <div className="histoire__texte">
                    <h2 className="section__title">Historiques</h2>
                    <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Eveniet, perferendis. Neque, quos, obcaecati cupiditate eaque veritatis itaque maiores minus, corporis iure ex asperiores animi. Veniam et debitis quasi nihil ab, quia dolorum accusamus, similique atque animi tempora natus! Repellat incidunt doloremque nam architecto. Aliquid, cumque repellat? Corporis maxime blanditiis delectus, saepe repellat minima, dolor velit dolorem deleniti reprehenderit nemo iste cupiditate similique impedit suscipit minus ad doloremque. Reiciendis cumque nostrum sed temporibus cum vero quasi, tempora quo perspiciatis debitis et eaque delectus? Consequatur praesentium neque consequuntur, accusamus nostrum error? Impedit ad libero quam sequi culpa nihil, delectus enim illum optio laborum blanditiis, magni voluptatum nesciunt! Quisquam ratione doloribus voluptate aliquid doloremque ut ducimus quaerat, quis tempore aperiam, nostrum debitis tempora animi blanditiis repellat. Iste rerum beatae aperiam nostrum maxime saepe consectetur, a obcaecati error, incidunt, nesciunt facilis iusto enim mollitia esse! Eligendi expedita eveniet incidunt minus eos, dignissimos, mollitia autem, nesciunt dolorem iusto aspernatur ex neque labore voluptates! Neque illum officiis iusto. Cumque explicabo voluptatem quasi deserunt porro velit.</p>
                
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
                            <img src={photo} alt=""/>
                        </div>
                        <div className="agent__info">
                            <p>Fonction :</p>
                            <p>Nom :</p>
                        </div>  
                    </div>
                    <div className="agent__resp card">
                        <div className="agent__img">
                            <img src={photo} alt=""/>
                        </div>
                        <div className="agent__info">
                            <p>Fonction :</p>
                            <p>Nom :</p>
                        </div>  
                    </div>
                    <div className="agent__resp card">
                        <div className="agent__img">
                            <img src={photo} alt=""/>
                        </div>
                        <div className="agent__info">
                            <p>Fonction :</p>
                            <p>Nom :</p>
                        </div>  
                    </div>
                </div>
                
            </div>
        </div>
    </section>
        </main>
    );
}