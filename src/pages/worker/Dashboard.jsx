"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import { useAuth } from "../../contexts/AuthContext"

function WorkerDashboard() {
  const { currentUser } = useAuth()
  const [profileStatus, setProfileStatus] = useState({
    documentsSubmitted: false,
    documentsVerified: false,
    testAssigned: false,
    testCompleted: false,
    testPassed: false,
    trainingAssigned: false,
    jobAssigned: false,
  })
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statusResponse, notificationsResponse] = await Promise.all([
          axios.get("/api/worker/profile-status"),
          axios.get("/api/worker/notifications"),
        ])

        setProfileStatus(statusResponse.data)
        setNotifications(notificationsResponse.data)
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

  // Helper function to determine the next step for the worker
  const getNextStep = () => {
    if (!profileStatus.documentsSubmitted) {
      return {
        message: "Veuillez soumettre vos documents (CV, diplômes, etc.)",
        link: "/worker/documents",
        linkText: "Soumettre mes documents",
      }
    } else if (!profileStatus.documentsVerified) {
      return {
        message: "Vos documents sont en cours de vérification par un responsable",
        link: null,
        linkText: null,
      }
    } else if (!profileStatus.testAssigned) {
      return {
        message: "En attente d'assignation d'un test de niveau",
        link: null,
        linkText: null,
      }
    } else if (!profileStatus.testCompleted) {
      return {
        message: "Vous avez un test de niveau à compléter",
        link: "/worker/tests",
        linkText: "Passer mon test",
      }
    } else if (profileStatus.testPassed && !profileStatus.jobAssigned) {
      return {
        message: "Félicitations! Vous avez réussi votre test. En attente d'affectation à un poste.",
        link: null,
        linkText: null,
      }
    } else if (!profileStatus.testPassed && !profileStatus.trainingAssigned) {
      return {
        message: "Vous n'avez pas obtenu la note minimale au test. En attente d'assignation à une formation.",
        link: null,
        linkText: null,
      }
    } else if (!profileStatus.testPassed && profileStatus.trainingAssigned) {
      return {
        message: "Une formation vous a été assignée pour améliorer vos compétences.",
        link: "/worker/trainings",
        linkText: "Voir ma formation",
      }
    } else if (profileStatus.jobAssigned) {
      return {
        message: "Félicitations! Vous avez été affecté à un poste.",
        link: "/worker/job-details",
        linkText: "Voir les détails du poste",
      }
    }
  }

  const nextStep = getNextStep()

  return (
    <div className="dashboard">
      <Sidebar role="worker" />

      <div className="main-content">
        <h1>Tableau de bord travailleur</h1>
        <p>
          Bienvenue, {currentUser?.firstName} {currentUser?.lastName}
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card" style={{ marginTop: "20px" }}>
          <h3>Statut de votre candidature</h3>
          <div className="progress-steps" style={{ marginTop: "20px" }}>
            <div className={`step ${profileStatus.documentsSubmitted ? "completed" : "active"}`}>
              <div className="step-icon">1</div>
              <div className="step-text">Soumission des documents</div>
            </div>
            <div
              className={`step ${profileStatus.documentsVerified ? "completed" : profileStatus.documentsSubmitted ? "active" : ""}`}
            >
              <div className="step-icon">2</div>
              <div className="step-text">Vérification des documents</div>
            </div>
            <div
              className={`step ${profileStatus.testCompleted ? "completed" : profileStatus.testAssigned ? "active" : ""}`}
            >
              <div className="step-icon">3</div>
              <div className="step-text">Test de niveau</div>
            </div>
            <div
              className={`step ${profileStatus.jobAssigned || profileStatus.trainingAssigned ? "completed" : profileStatus.testCompleted ? "active" : ""}`}
            >
              <div className="step-icon">4</div>
              <div className="step-text">
                {profileStatus.testPassed ? "Affectation à un poste" : "Affectation à une formation"}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: "20px" }}>
          <h3>Prochaine étape</h3>
          <p>{nextStep.message}</p>
          {nextStep.link && (
            <a href={nextStep.link} className="btn btn-primary" style={{ marginTop: "10px" }}>
              {nextStep.linkText}
            </a>
          )}
        </div>

        <div className="notifications" style={{ marginTop: "30px" }}>
          <h2>Notifications récentes</h2>
          <div className="card">
            {notifications.length > 0 ? (
              <ul className="notification-list">
                {notifications.map((notification, index) => (
                  <li key={index} className="notification-item">
                    <div className="notification-date">{new Date(notification.date).toLocaleDateString()}</div>
                    <div className="notification-content">{notification.message}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucune notification récente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkerDashboard
