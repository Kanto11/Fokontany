import { NavLink, Outlet, useNavigate } from "react-router-dom";


export default function LayoutEspace({ titre, liens }) {
  const navigate = useNavigate();

  function deconnexion() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <div className="espace">
        <div className="espace__container">
            <aside className="espace__menu">
              <h2>{titre}</h2>
              <nav>
                {liens.map((l) => (
                  <NavLink key={l.chemin} to={l.chemin} end={l.exact}>
                {l.texte}
                </NavLink>
                ))}
              </nav>
              <div className="logos">
                <span className="fkt">Fkt</span>
                <span className="logos__lieu">Andohamandry</span>
              </div>
              <button onClick={deconnexion}>Se déconnecter</button>
            </aside>
            <main className="espace__contenu">
              <Outlet />
            </main>
          </div>
    </div>
    
  );
}