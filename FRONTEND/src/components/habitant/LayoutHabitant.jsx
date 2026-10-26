import {NavLink ,Outlet ,  useNavigate} from "react-router-dom"

export default function LayoutHabitant(){
    const navigate =  useNavigate()

    // function deconnexion(){
    //     localStorage.clear();
    //     navigate("/");
    // }

    return (
        <div className="Responsable">
            <div className="resp__left">
                <h2>Bonjour</h2>
            </div>
            <div className="resp__right">
                <h2>Kanto</h2>
            </div>
        </div>
    )
}