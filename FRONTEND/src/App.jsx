import { Routes, Route }from "react-router-dom";

import Accueil from "./pages/Accueil";
import Authentification from "./pages/Authetification";
import RouteProtegee from "./components/RouteProtegee";

import LayoutResponsable from "./components/responsable/LayoutResponsable";
import AccueilResponsable from "./pages/RESPONSABLE/AccueilResponsable";
import Habitants from "./pages/RESPONSABLE/HabitantResponsable";
import CotisationResponsable from "./pages/RESPONSABLE/CotisationResponsable";
import PublicationResp from"./pages/RESPONSABLE/PublicationResponsable";
import MessagesResp from"./pages/RESPONSABLE/MessagesResponsable";
import ResidenceResp from "./pages/RESPONSABLE/ResidenceResponsables";

import LayoutHabitant from "./components/habitant/LayoutHabitant";
import CotisationHab from "./pages/HABITANT/CotisationsHab";
import ResidenceHab from "./pages/HABITANT/MesResidences";
import AccueilHb from "./pages/HABITANT/PublicationsHabitant"
function ABientot({ nom }) {
  return <p>Page « {nom} » : à construire.</p>;
}
function App() {
  return (
    <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/authentification" element={<Authentification />} />
        
        <Route element={<RouteProtegee type="HABITANT"/>}>
          <Route path="/habitant" element={<LayoutHabitant/>}>
            <Route path="cotisations" element={<CotisationHab/>}/>
            <Route path="residences" element={<ResidenceHab/>}/>
            <Route path="" element={<AccueilHb/>}/>
          </Route>
          
        </Route>

        <Route element={<RouteProtegee type="RESPONSABLE" />}>
              <Route path="/responsable" element={<LayoutResponsable />}>
                <Route index element={<AccueilResponsable />} />
                <Route path="carnets" element={<Habitants />} />
                <Route path="cotisations" element={<CotisationResponsable/>}/>
                <Route path="publications" element={<PublicationResp />} />
                <Route path="messages" element={<MessagesResp/>}/>
                <Route path="residences" element={<ResidenceResp/>}/>
              </Route>
        </Route>
    </Routes>
  )
}

export default App
