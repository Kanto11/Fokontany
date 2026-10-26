
import React ,{useState,useEffect} from "react";
import api from "../../api";
import dayjs from 'dayjs';
import edit from "../../assets/Icons/pencil.png";



export default function PublicationResponsable(){
    
    const [publications, setPublications] = useState([]);
    const [texte_pub, setTexte_pub] = useState("");
    const [editId, setEditId] = useState(null);
    const [recherche, setRecherche] = useState("");     
    const [dateDebut, setDateDebut] = useState("");      
    const [dateFin, setDateFin] = useState("");          

    const aujourdhui = new Date();
    const dateFormate = aujourdhui.toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });


    const chargerPublications = (filtres = {}) => {
        api.get("publications/", { params: filtres })
            .then(res => setPublications(res.data));
    };

    useEffect(() => {
        chargerPublications();
    }, []);


    const openEdit = (p) => {
        setEditId(p.id);
        setTexte_pub(p.texte_Pub);
    };

    const annuler = () => {
        setEditId(null);
        setTexte_pub("");
    };

    const btnvalide = async (e) => {
        e.preventDefault();
        try {
            if (editId === null) {
                const res = await api.post("publications/", { texte_Pub: texte_pub });
                setPublications([res.data, ...publications]);
            } else {
                const res = await api.patch(`publications/${editId}/`, { texte_Pub: texte_pub });
                setPublications(publications.map(p => p.id === editId ? res.data : p));
            }
            setTexte_pub("");
            setEditId(null);
        } catch (err) {
            console.error("STATUT :", err.response?.status);
            console.error("RÉPONSE :", err.response?.data);
            if (err.response?.status === 403) {
                alert(err.response.data.detail);
            } else {
                alert("Erreur : l'opération a échoué");
            }
        }
    };

    const rechercher = () => {
        if (dateDebut && dateFin && dateDebut > dateFin) {
            alert("La date de début doit être avant la date de fin.");
            return;
        }
        chargerPublications({
            responsable: recherche,
            date_debut: dateDebut,
            date_fin: dateFin,
        });
    };

    const reinitialiser = () => {
        setRecherche("");
        setDateDebut("");
        setDateFin("");
        chargerPublications();
    };


    return(<>
            <div className="pub__resp">
                <div className="pub__resp__body">
                    <div className="pub__resp__body__left">
                        <div className="card__pub__resp__header">
                            <h3>Historiques du publication</h3>
                            <div className="resp__search">
                                <input type="text" placeholder="recherche par responsable" value={recherche} onChange={(e)=>setRecherche(e.target.value)}/>
                                <div className="resp__search__date">
                                    <div className="resp__date">
                                        <label htmlFor="">Date debut</label>
                                        <input type="date" value={dateDebut} onChange={(e)=> setDateDebut(e.target.value)}/>
                                    </div>
                                    <div className="resp__date">
                                        <label htmlFor="">Date fin</label>
                                        <input type="date" value={dateFin} onChange={(e)=> setDateFin(e.target.value)}/>
                                    </div>
                                    <div className="resp__search__action">
                                            <button onClick={rechercher}><span>Rechercher</span></button>
                                            <button onClick={reinitialiser}><span>Actualiser</span></button>
                                    </div>
                                    
                                </div>
                            </div>
                        </div>
                        <div className="pub__left__container">
                             <ul>
                            {publications.map(p => 
                                <li key={p.id} className="card__pub ">
                                    
                                    <label >{p.auteur}</label>
                                    <br/>
                                    <label >{dayjs(p.date_Pub).format('DD/MM/YYYY HH:mm')}</label>
                                    <p>{p.texte_Pub}</p>
                                    <div className="card__pub__btn">
                                    {p.peut_modifier && (
                                        <button onClick={() => openEdit(p)}><img src={edit} alt="" /><span>Modifier</span></button>
                                    )}
                                    </div>
                                    
                                </li>)}
                             </ul>
                        </div>
                       
                    </div>
                    <div className="pub__resp__body__right">
                        <h3>{editId === null ? "Créer une publication" : "Modifier la publication"}</h3>
                        <form onSubmit={btnvalide}>
                            <div className="pub__info">
                                <label htmlFor="">Date :</label>
                                <label htmlFor="">{dateFormate}</label>
                                <textarea name="" id="" placeholder="Votre text ici"value={texte_pub} onChange={(e)=>setTexte_pub(e.target.value)}></textarea>
                            </div>
                            <div className="pub__form__action">
                                <button className="btn__valider" type="submit"> <span>{editId === null ? "Publier" : "Enregistrer"}</span></button>
                                <button className="btn__danger" type ="button" onClick={annuler}><span>Annuler</span></button>
                            </div>
                        </form>
                        
                    </div>
                    
                </div>
            </div>

            
        </>
    )
}