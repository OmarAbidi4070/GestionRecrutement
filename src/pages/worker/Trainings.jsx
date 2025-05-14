"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import { useAuth } from "../../contexts/AuthContext"

function Trainings() {
  const { currentUser } = useAuth()
  const [trainings, setTrainings] = useState([])
  const [currentTraining, setCurrentTraining] = useState(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const response = await axios.get("/api/worker/trainings")
        setTrainings(response.data)

        // Si l'utilisateur a une formation en cours, la définir comme formation actuelle
        const activeTraining = response.data.find(
          (training) => training.status === "in_progress" || training.status === "assigned",
        )

        if (activeTraining) {
          setCurrentTraining(activeTraining)
          setProgress(activeTraining.progress || 0)
        }

        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des formations")
        setLoading(false)
        console.error(err)
      }
    }

    fetchTrainings()
  }, [])

  const handleStartTraining = async (trainingId) => {
    try {
      const response = await axios.post(`/api/worker/trainings/${trainingId}/start`)

      // Mettre à jour la liste des formations
      setTrainings(
        trainings.map((training) =>
          training._id === trainingId ? { ...training, status: "in_progress", startedAt: new Date() } : training,
        ),
      )

      // Définir la formation actuelle
      setCurrentTraining(response.data)
      setProgress(0)

      setSuccess("Formation démarrée avec succès")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du démarrage de la formation")
      console.error(err)
    }
  }

  const handleUpdateProgress = async () => {
    try {
      if (!currentTraining) return

      // Simuler une progression (dans une application réelle, cela serait basé sur des critères spécifiques)
      const newProgress = Math.min(progress + 10, 100)

      await axios.post(`/api/worker/trainings/${currentTraining._id}/progress`, {
        progress: newProgress,
      })

      setProgress(newProgress)

      // Si la progression atteint 100%, marquer la formation comme terminée
      if (newProgress === 100) {
        setTrainings(
          trainings.map((training) =>
            training._id === currentTraining._id
              ? { ...training, status: "completed", completedAt: new Date() }
              : training,
          ),
        )

        setSuccess("Félicitations! Vous avez terminé cette formation.")
      } else {
        setSuccess("Progression mise à jour")
      }

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la mise à jour de la progression")
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar role="worker" />
        <div className="main-content">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Sidebar role="worker" />

      <div className="main-content">
        <h1>Formations</h1>
        <p>Suivez vos formations assignées pour améliorer vos compétences</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {currentTraining ? (
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3>Formation en cours: {currentTraining.trainingId?.title || "Formation"}</h3>

            <div className="training-info" style={{ marginBottom: "20px" }}>
              <p>{currentTraining.trainingId?.description}</p>
              <p>
                <strong>Durée estimée:</strong> {currentTraining.trainingId?.duration || "N/A"} jours
              </p>
              <p>
                <strong>Date de début:</strong>{" "}
                {new Date(currentTraining.startedAt || currentTraining.assignedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="progress-container" style={{ marginBottom: "20px" }}>
              <label>
                <strong>Progression: {progress}%</strong>
              </label>
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                  aria-valuenow={progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {progress}%
                </div>
              </div>
            </div>

            {currentTraining.status !== "completed" && (
              <div className="training-actions">
                <button className="btn btn-primary" onClick={handleUpdateProgress} disabled={progress === 100}>
                  Marquer une progression
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ marginBottom: "20px", textAlign: "center", padding: "30px" }}>
            <h3>Aucune formation en cours</h3>
            <p>Vous n'avez pas de formation active pour le moment.</p>
          </div>
        )}

        <h2>Historique des formations</h2>

        {trainings.length > 0 ? (
          <div className="trainings-list">
            {trainings.map((training) => (
              <div key={training._id} className="card" style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3>{training.trainingId?.title || "Formation"}</h3>
                  <span className={`badge badge-${getStatusBadgeClass(training.status)}`}>
                    {getStatusLabel(training.status)}
                  </span>
                </div>

                <p>{training.trainingId?.description}</p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p>
                      <strong>Assigné le:</strong> {new Date(training.assignedAt).toLocaleDateString()}
                    </p>
                    {training.startedAt && (
                      <p>
                        <strong>Commencé le:</strong> {new Date(training.startedAt).toLocaleDateString()}
                      </p>
                    )}
                    {training.completedAt && (
                      <p>
                        <strong>Terminé le:</strong> {new Date(training.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {training.status === "assigned" && (
                    <button className="btn btn-primary" onClick={() => handleStartTraining(training._id)}>
                      Commencer
                    </button>
                  )}
                </div>

                {training.status !== "assigned" && (
                  <div className="progress" style={{ marginTop: "10px" }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${training.progress || 0}%` }}
                      aria-valuenow={training.progress || 0}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {training.progress || 0}%
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>Aucune formation n'a été assignée.</p>
        )}
      </div>
    </div>
  )
}

// Fonctions utilitaires
function getStatusLabel(status) {
  switch (status) {
    case "assigned":
      return "Assignée"
    case "in_progress":
      return "En cours"
    case "completed":
      return "Terminée"
    default:
      return status
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "assigned":
      return "warning"
    case "in_progress":
      return "info"
    case "completed":
      return "success"
    default:
      return "secondary"
  }
}

export default Trainings
