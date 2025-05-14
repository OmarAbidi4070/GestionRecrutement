"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import { useAuth } from "../../contexts/AuthContext"
import "../../pages/responsable/Dashboard.css"

function ResponsableDashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState({
    pendingCandidates: 0,
    assignedTests: 0,
    pendingTrainings: 0,
    unreadMessages: 0,
  })
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, candidatesResponse] = await Promise.all([
          axios.get("/api/responsable/dashboard"),
          axios.get("/api/responsable/candidates?limit=5"),
        ])

        setStats(statsResponse.data)
        setCandidates(candidatesResponse.data)
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
      <Sidebar role="responsable" />

      <div className="main-content">
        <h1>Tableau de bord responsable</h1>
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
            <h3>Candidatures</h3>
            <p className="stat-number">{stats.pendingCandidates}</p>
            <p>En attente de vérification</p>
          </div>

          <div className="card">
            <h3>Tests</h3>
            <p className="stat-number">{stats.assignedTests}</p>
            <p>Tests assignés</p>
          </div>

          <div className="card">
            <h3>Formations</h3>
            <p className="stat-number">{stats.pendingTrainings}</p>
            <p>Formations en cours</p>
          </div>

          <div className="card">
            <h3>Messages</h3>
            <p className="stat-number">{stats.unreadMessages}</p>
            <p>Messages non lus</p>
          </div>
        </div>

        <div className="recent-candidates" style={{ marginTop: "30px" }}>
          <h2>Candidatures récentes</h2>
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.length > 0 ? (
                    candidates.map((candidate) => (
                      <tr key={candidate._id}>
                        <td>
                          {candidate.firstName} {candidate.lastName}
                        </td>
                        <td>{new Date(candidate.createdAt).toLocaleDateString()}</td>
                        <td>{candidate.status}</td>
                        <td>
                          <button className="btn btn-primary btn-sm">Voir</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center" }}>
                        Aucune candidature récente
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponsableDashboard
