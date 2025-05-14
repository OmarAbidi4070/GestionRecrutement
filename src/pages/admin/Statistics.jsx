"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Statistics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    usersByRole: {
      admin: 0,
      responsable: 0,
      worker: 0,
    },
    testsCompleted: 0,
    testsPassed: 0,
    testsFailed: 0,
    trainingsAssigned: 0,
    trainingsCompleted: 0,
    jobsCreated: 0,
    jobsAssigned: 0,
    complaintsResolved: 0,
    complaintsRejected: 0,
    complaintsTotal: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get("/api/admin/statistics")
        setStats(response.data)
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
          <div className="loading">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Sidebar role="admin" />

      <div className="main-content">
        <h1>Statistiques</h1>
        <p>Consultez les statistiques globales de la plateforme</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="stats-section">
          <h2>Utilisateurs</h2>
          <div
            className="stats-container"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <div className="card">
              <h3>Total</h3>
              <p className="stat-number">{stats.totalUsers}</p>
              <p>Utilisateurs inscrits</p>
            </div>

            <div className="card">
              <h3>Actifs</h3>
              <p className="stat-number">{stats.activeUsers}</p>
              <p>Utilisateurs actifs</p>
            </div>

            <div className="card">
              <h3>En attente</h3>
              <p className="stat-number">{stats.pendingUsers}</p>
              <p>Utilisateurs en attente</p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "30px" }}>
            <h3>Répartition par rôle</h3>
            <div style={{ display: "flex", height: "200px", marginTop: "20px" }}>
              <div
                style={{
                  flex: stats.usersByRole.admin,
                  backgroundColor: "#3f51b5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Admin
                <br />
                {stats.usersByRole.admin}
              </div>
              <div
                style={{
                  flex: stats.usersByRole.responsable,
                  backgroundColor: "#2196f3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Responsables
                <br />
                {stats.usersByRole.responsable}
              </div>
              <div
                style={{
                  flex: stats.usersByRole.worker,
                  backgroundColor: "#03a9f4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Travailleurs
                <br />
                {stats.usersByRole.worker}
              </div>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h2>Tests et formations</h2>
          <div
            className="stats-container"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <div className="card">
              <h3>Tests complétés</h3>
              <p className="stat-number">{stats.testsCompleted}</p>
              <div style={{ display: "flex", marginTop: "10px" }}>
                <div
                  style={{
                    flex: stats.testsPassed,
                    backgroundColor: "#4caf50",
                    height: "10px",
                    borderRadius: "5px 0 0 5px",
                  }}
                ></div>
                <div
                  style={{
                    flex: stats.testsFailed,
                    backgroundColor: "#f44336",
                    height: "10px",
                    borderRadius: "0 5px 5px 0",
                  }}
                ></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px", fontSize: "0.8rem" }}>
                <span>{stats.testsPassed} réussis</span>
                <span>{stats.testsFailed} échoués</span>
              </div>
            </div>

            <div className="card">
              <h3>Formations</h3>
              <p className="stat-number">{stats.trainingsAssigned}</p>
              <p>Formations assignées</p>
              <div style={{ marginTop: "10px" }}>
                <div
                  style={{
                    width: `${(stats.trainingsCompleted / stats.trainingsAssigned) * 100 || 0}%`,
                    backgroundColor: "#4caf50",
                    height: "10px",
                    borderRadius: "5px",
                  }}
                ></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px", fontSize: "0.8rem" }}>
                <span>{stats.trainingsCompleted} complétées</span>
                <span>{Math.round((stats.trainingsCompleted / stats.trainingsAssigned) * 100 || 0)}%</span>
              </div>
            </div>

            <div className="card">
              <h3>Emplois</h3>
              <p className="stat-number">{stats.jobsCreated}</p>
              <p>Offres d'emploi créées</p>
              <div style={{ marginTop: "10px" }}>
                <div
                  style={{
                    width: `${(stats.jobsAssigned / stats.jobsCreated) * 100 || 0}%`,
                    backgroundColor: "#ff9800",
                    height: "10px",
                    borderRadius: "5px",
                  }}
                ></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px", fontSize: "0.8rem" }}>
                <span>{stats.jobsAssigned} assignés</span>
                <span>{Math.round((stats.jobsAssigned / stats.jobsCreated) * 100 || 0)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h2>Réclamations</h2>
          <div className="card">
            <h3>État des réclamations</h3>
            <p className="stat-number">{stats.complaintsTotal}</p>
            <p>Réclamations totales</p>

            <div style={{ display: "flex", marginTop: "20px" }}>
              <div
                style={{
                  flex: stats.complaintsResolved,
                  backgroundColor: "#4caf50",
                  height: "20px",
                  borderRadius: "5px 0 0 5px",
                }}
              ></div>
              <div style={{ flex: stats.complaintsRejected, backgroundColor: "#f44336", height: "20px" }}></div>
              <div
                style={{
                  flex: stats.complaintsTotal - stats.complaintsResolved - stats.complaintsRejected,
                  backgroundColor: "#ff9800",
                  height: "20px",
                  borderRadius: "0 5px 5px 0",
                }}
              ></div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#4caf50",
                    borderRadius: "50%",
                    marginRight: "5px",
                  }}
                ></span>
                <span>{stats.complaintsResolved} résolues</span>
              </div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#f44336",
                    borderRadius: "50%",
                    marginRight: "5px",
                  }}
                ></span>
                <span>{stats.complaintsRejected} rejetées</span>
              </div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#ff9800",
                    borderRadius: "50%",
                    marginRight: "5px",
                  }}
                ></span>
                <span>{stats.complaintsTotal - stats.complaintsResolved - stats.complaintsRejected} en attente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Statistics
