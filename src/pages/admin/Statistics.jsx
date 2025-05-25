"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Statistics() {
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fonction pour obtenir les headers d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get("/api/admin/statistics", {
          headers: getAuthHeaders(),
        })
        setStatistics(response.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des statistiques")
        setLoading(false)
        console.error(err)
      }
    }

    fetchStatistics()
  }, [])

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar role="admin" />
        <div className="main-content">
          <div className="loading">Chargement des statistiques...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard">
        <Sidebar role="admin" />
        <div className="main-content">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    )
  }

  const { userStats, testStats, trainingStats, complaintStats, documentStats, summary, recentActivity } = statistics

  return (
    <div className="dashboard">
      <Sidebar role="admin" />

      <div className="main-content">
        <h1>Statistiques de la plateforme</h1>
        <p>Vue d'ensemble des données et de l'activité de la plateforme</p>

        {/* Résumé général */}
        <div className="row" style={{ marginBottom: "30px" }}>
          <div className="col-md-3">
            <div className="card text-center" style={{ backgroundColor: "#e3f2fd" }}>
              <div className="card-body">
                <h2 style={{ color: "#1976d2" }}>{summary.totalUsers}</h2>
                <p>Utilisateurs totaux</p>
                <small className="text-muted">{summary.activeUsers} actifs</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center" style={{ backgroundColor: "#f3e5f5" }}>
              <div className="card-body">
                <h2 style={{ color: "#7b1fa2" }}>{summary.totalTests}</h2>
                <p>Tests créés</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center" style={{ backgroundColor: "#e8f5e8" }}>
              <div className="card-body">
                <h2 style={{ color: "#388e3c" }}>{summary.totalTrainings}</h2>
                <p>Formations créées</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center" style={{ backgroundColor: "#fff3e0" }}>
              <div className="card-body">
                <h2 style={{ color: "#f57c00" }}>{summary.totalMessages}</h2>
                <p>Messages échangés</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="card" style={{ marginBottom: "30px" }}>
          <div className="card-header">
            <h3>📈 Activité de la semaine</h3>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <div className="text-center">
                  <h4 style={{ color: "#1976d2" }}>{recentActivity.newUsersThisWeek}</h4>
                  <p>Nouveaux utilisateurs</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <h4 style={{ color: "#7b1fa2" }}>{recentActivity.testsCompletedThisWeek}</h4>
                  <p>Tests complétés</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <h4 style={{ color: "#388e3c" }}>{recentActivity.trainingsCompletedThisWeek}</h4>
                  <p>Formations terminées</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <h4 style={{ color: "#f57c00" }}>{recentActivity.messagesThisWeek}</h4>
                  <p>Messages envoyés</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Statistiques des utilisateurs */}
          <div className="col-md-6">
            <div className="card" style={{ marginBottom: "20px" }}>
              <div className="card-header">
                <h3>👥 Utilisateurs par rôle et statut</h3>
              </div>
              <div className="card-body">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Rôle</th>
                      <th>Statut</th>
                      <th>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map((stat, index) => (
                      <tr key={index}>
                        <td>
                          <span
                            className={`badge ${
                              stat._id.role === "admin"
                                ? "badge-danger"
                                : stat._id.role === "responsable"
                                  ? "badge-warning"
                                  : "badge-info"
                            }`}
                          >
                            {stat._id.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              stat._id.status === "active"
                                ? "badge-success"
                                : stat._id.status === "pending"
                                  ? "badge-warning"
                                  : "badge-danger"
                            }`}
                          >
                            {stat._id.status}
                          </span>
                        </td>
                        <td>
                          <strong>{stat.count}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Statistiques des tests */}
          <div className="col-md-6">
            <div className="card" style={{ marginBottom: "20px" }}>
              <div className="card-header">
                <h3>📝 Résultats des tests</h3>
              </div>
              <div className="card-body">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Résultat</th>
                      <th>Nombre</th>
                      <th>Score moyen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testStats.map((stat, index) => (
                      <tr key={index}>
                        <td>
                          <span className={`badge ${stat._id ? "badge-success" : "badge-danger"}`}>
                            {stat._id ? "Réussi" : "Échoué"}
                          </span>
                        </td>
                        <td>
                          <strong>{stat.count}</strong>
                        </td>
                        <td>{stat.avgScore ? `${Math.round(stat.avgScore)}%` : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Statistiques des formations */}
          <div className="col-md-4">
            <div className="card" style={{ marginBottom: "20px" }}>
              <div className="card-header">
                <h3>🎓 Formations</h3>
              </div>
              <div className="card-body">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Statut</th>
                      <th>Nombre</th>
                      <th>Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingStats.map((stat, index) => (
                      <tr key={index}>
                        <td>
                          <span className={`badge ${stat._id ? "badge-success" : "badge-info"}`}>
                            {stat._id ? "Terminées" : "En cours"}
                          </span>
                        </td>
                        <td>
                          <strong>{stat.count}</strong>
                        </td>
                        <td>{stat.avgProgress ? `${Math.round(stat.avgProgress)}%` : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Statistiques des réclamations */}
          <div className="col-md-4">
            <div className="card" style={{ marginBottom: "20px" }}>
              <div className="card-header">
                <h3>📋 Réclamations</h3>
              </div>
              <div className="card-body">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Statut</th>
                      <th>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaintStats.map((stat, index) => (
                      <tr key={index}>
                        <td>
                          <span
                            className={`badge ${
                              stat._id === "resolved"
                                ? "badge-success"
                                : stat._id === "pending"
                                  ? "badge-warning"
                                  : stat._id === "in-progress"
                                    ? "badge-info"
                                    : "badge-danger"
                            }`}
                          >
                            {stat._id === "resolved"
                              ? "Résolues"
                              : stat._id === "pending"
                                ? "En attente"
                                : stat._id === "in-progress"
                                  ? "En cours"
                                  : "Rejetées"}
                          </span>
                        </td>
                        <td>
                          <strong>{stat.count}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Statistiques des documents */}
          <div className="col-md-4">
            <div className="card" style={{ marginBottom: "20px" }}>
              <div className="card-header">
                <h3>📄 Documents</h3>
              </div>
              <div className="card-body">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Statut</th>
                      <th>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentStats.map((stat, index) => (
                      <tr key={index}>
                        <td>
                          <span
                            className={`badge ${
                              stat._id === "approved"
                                ? "badge-success"
                                : stat._id === "pending"
                                  ? "badge-warning"
                                  : "badge-danger"
                            }`}
                          >
                            {stat._id === "approved" ? "Approuvés" : stat._id === "pending" ? "En attente" : "Rejetés"}
                          </span>
                        </td>
                        <td>
                          <strong>{stat.count}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Statistics
