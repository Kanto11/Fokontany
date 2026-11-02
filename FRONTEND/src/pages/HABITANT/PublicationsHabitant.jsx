import { useEffect, useState } from "react";
import api from "../../api";

const quand = (d) =>
  new Date(d).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });

export default function PublicationsHabitant() {
  const [publications, setPublications] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    setChargement(true);
    api.get("/publications/habitant/",)
      .then(({ data }) => {
        setPublications(data.resultats);
        setErreur("");
      })
      .catch(() => setErreur("Impossible de charger les publications."))
      .finally(() => setChargement(false));
  }, []);

  return (<>

    <div className="publicationsH">
      <div className="wrapper">
        <div className="publicationsH__containers">
          <div className="pubH__headers">
            <h3 className="section__title">Publications du quartiers</h3>
            {erreur && <p style={{ color: "red" }}>{erreur}</p>}
          </div>
          <div className="pubH__body">
              { chargement ? (
                  <p>Chargement...</p>
                ) : publications.length === 0 ?(
                  <p>Aucune publication pour le moment </p>
                ) : (
                  <>
                    <div className="pubsH__liste">
                      <ul>
                        {publications.map((p) => (
                            <li key={p.id}>
                              <div className="">
                                <label htmlFor="">{quand(p.date)}</label><br/>
                                <label htmlFor="">{p.texte}</label>
                              </div>

                            </li>
                        ))}
                        
                      </ul>
                    </div>
                  </>
                )

              }
          </div>
        </div>
      </div>
    </div>
    </>
  );
}