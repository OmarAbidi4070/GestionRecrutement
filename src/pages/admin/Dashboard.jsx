"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import { useAuth } from "../../contexts/AuthContext"

function AdminDashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingResponsibles: 0,
    totalJobs: 0,
    pendingComplaints: 0,
    pendingAssignments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("/api/admin/dashboard")
        setStats(response.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des données")
        setLoading(false)
        console.error(err)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return <div className="loading">Chargement...</div>
  }

  return (
    <div className="dashboard">
      <Sidebar role="admin" />

      <div className="main-content">
        <h1>Tableau de bord administrateur</h1>
        <p>
          Bienvenue, {currentUser?.firstName} {currentUser?.lastName}
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <div
          className="stats-container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div className="card">
            <h3>Utilisateurs</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <p>Utilisateurs inscrits</p>
          </div>

          <div className="card">
            <h3>Responsables</h3>
            <p className="stat-number">{stats.pendingResponsibles}</p>
            <p>En attente d'approbation</p>
          </div>

          <div className="card">
            <h3>Offres d'emploi</h3>
            <p className="stat-number">{stats.totalJobs}</p>
            <p>Postes disponibles</p>
          </div>

          <div className="card">
            <h3>Réclamations</h3>
            <p className="stat-number">{stats.pendingComplaints}</p>
            <p>En attente de traitement</p>
          </div>

          <div className="card">
            <h3>Affectations</h3>
            <p className="stat-number">{stats.pendingAssignments}</p>
            <p>Candidats en attente d'affectation</p>
          </div>
        </div>

        <div className="recent-activities" style={{ marginTop: "30px" }}>
          <h2>Activités récentes</h2>
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Utilisateur</th>
                    <th>Action</th>
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2023-05-15</td>
                    <td>Ahmed Benali</td>
                    <td>Inscription</td>
                    <td>Nouveau responsable en attente d'approbation</td>
                  </tr>
                  <tr>
                    <td>2023-05-14</td>
                    <td>Système</td>
                    <td>Test terminé</td>
                    <td>5 candidats ont terminé leur test de niveau</td>
                  </tr>
                  <tr>
                    <td>2023-05-13</td>
                    <td>Fatima Zahra</td>
                    <td>Réclamation</td>
                    <td>Nouvelle réclamation concernant l'affectation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
