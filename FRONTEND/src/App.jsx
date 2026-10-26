import { useState } from 'react';
import { Routes, Route } from "react-router-dom";

import Accueil from "./pages/Accueil";
import Authentification from "./pages/Authetification";
import RouteProtegee from "./components/RouteProtegee";
import LayoutResponsable from "./components/responsable/LayoutResponsable";
import LayoutHabitant from "./components/habitant/LayoutHabitant";
import AccueilResponsable from "./pages/RESPONSABLE/AccueilResponsable";
import Habitants from "./pages/RESPONSABLE/HabitantResponsable";
import PublicationResp from"./pages/RESPONSABLE/PublicationResponsable";
import MessagesResp from"./pages/RESPONSABLE/MessagesResponsable";

function ABientot({ nom }) {
  return <p>Page « {nom} » : à construire.</p>;
}
function App() {
  return (
    <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/authentification" element={<Authentification />} />
        
        <Route element={<RouteProtegee type="HABITANT"/>}>
          <Route path="/habitant" element={<LayoutHabitant/>}/>
          
        </Route>

        <Route element={<RouteProtegee type="RESPONSABLE" />}>
              <Route path="/responsable" element={<LayoutResponsable />}>
                <Route index element={<AccueilResponsable />} />
                <Route path="carnets" element={<Habitants />} />
                <Route path="publications" element={<PublicationResp />} />
                <Route path="messages" element={<MessagesResp/>}/>
              </Route>
        </Route>
    </Routes>
  )
}

export default App
