"use client"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "./Sidebar.css"

function Sidebar({ role }) {
  const { logout, currentUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Menu items based on user role
  const getMenuItems = () => {
    switch (role) {
      case "admin":
        return [
          { path: "/admin/dashboard", label: "Tableau de bord" },
          { path: "/admin/users", label: "Gestion des utilisateurs" },
          { path: "/admin/jobs", label: "Offres d'emploi" },
          { path: "/admin/complaints", label: "Réclamations" },
          { path: "/admin/test-results", label: "Résultats des tests" },
          { path: "/admin/statistics", label: "Statistiques" },
          { path: "/admin/messages", label: "Messagerie" },
        ]
      case "responsable":
        return [
          { path: "/responsable/dashboard", label: "Tableau de bord" },
          { path: "/responsable/candidates", label: "Candidatures" },
          { path: "/responsable/tests", label: "Tests de niveau" },
          { path: "/responsable/trainings", label: "Formations" },
          { path: "/responsable/messages", label: "Messagerie" },
        ]
      case "worker":
        return [
          { path: "/worker/dashboard", label: "Tableau de bord" },
          { path: "/worker/profile", label: "Mon profil" },
          { path: "/worker/documents", label: "Mes documents" },
          { path: "/worker/tests", label: "Tests de niveau" },
          { path: "/worker/trainings", label: "Formations" },
          { path: "/worker/complaints", label: "Réclamations" },
          { path: "/worker/messages", label: "Messagerie" },
        ]
      default:
        return []
    }
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Gestion de Recrutement</h3>
        <p>
          {currentUser?.firstName} {currentUser?.lastName}
        </p>
        <p className="text-muted">{role.charAt(0).toUpperCase() + role.slice(1)}</p>
      </div>

      <ul className="sidebar-menu">
        {getMenuItems().map((item, index) => (
          <li key={index}>
            <NavLink to={item.path} className={({ isActive }) => (isActive ? "active" : "")}>
              {item.label}
            </NavLink>
          </li>
        ))}

        <li>
          <a href="#" onClick={handleLogout} className="logout-link">
            Déconnexion
          </a>
        </li>
      </ul>
    </div>
  )
}

export default Sidebar
