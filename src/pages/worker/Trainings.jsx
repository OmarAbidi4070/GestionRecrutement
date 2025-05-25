"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import { useAuth } from "../../contexts/AuthContext"

function Trainings() {
  const { currentUser } = useAuth()
  const [trainings, setTrainings] = useState([])
  const [currentTraining, setCurrentTraining] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fonction pour obtenir les headers d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const response = await axios.get("/api/worker/trainings", {
          headers: getAuthHeaders(),
        })
        setTrainings(response.data)

        // Si l'utilisateur a une formation en cours, la définir comme formation actuelle
        const activeTraining = response.data.find((training) => training.progress && !training.progress.completed)

        if (activeTraining) {
          setCurrentTraining(activeTraining)
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
      const response = await axios.get(`/api/worker/trainings/${trainingId}`, {
        headers: getAuthHeaders(),
      })

      setCurrentTraining(response.data)
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

      // Calculer la nouvelle progression
      const currentProgress = currentTraining.progress?.percentage || 0
      const newProgress = Math.min(currentProgress + 10, 100)

      await axios.put(
        `/api/worker/trainings/${currentTraining.id}/progress`,
        {
          progress: newProgress,
        },
        {
          headers: getAuthHeaders(),
        },
      )

      // Mettre à jour la formation actuelle
      const updatedTraining = {
        ...currentTraining,
        progress: {
          ...currentTraining.progress,
          percentage: newProgress,
          completed: newProgress === 100,
          completedAt: newProgress === 100 ? new Date().toISOString() : null,
        },
      }

      setCurrentTraining(updatedTraining)

      // Mettre à jour la liste des formations
      setTrainings(trainings.map((training) => (training.id === currentTraining.id ? updatedTraining : training)))

      if (newProgress === 100) {
        setSuccess("Félicitations! Vous avez terminé cette formation.")
        setCurrentTraining(null)
      } else {
        setSuccess("Progression mise à jour")
      }

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la mise à jour de la progression")
      console.error(err)
    }
  }

  const handleDownloadAttachment = (trainingId, attachmentId, filename) => {
    const token = localStorage.getItem("token")
    const url = `/api/training/${trainingId}/attachment/${attachmentId}?token=${token}`

    // Créer un lien de téléchargement
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            <h3>Formation en cours: {currentTraining.title}</h3>

            <div className="training-info" style={{ marginBottom: "20px" }}>
              <p>{currentTraining.description}</p>
              <p>
                <strong>Durée estimée:</strong> {currentTraining.duration || "N/A"} jours
              </p>
              <p>
                <strong>Date de début:</strong>{" "}
                {currentTraining.progress?.startedAt
                  ? new Date(currentTraining.progress.startedAt).toLocaleDateString()
                  : "Non démarrée"}
              </p>
            </div>

            <div className="progress-container" style={{ marginBottom: "20px" }}>
              <label>
                <strong>Progression: {currentTraining.progress?.percentage || 0}%</strong>
              </label>
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${currentTraining.progress?.percentage || 0}%` }}
                  aria-valuenow={currentTraining.progress?.percentage || 0}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {currentTraining.progress?.percentage || 0}%
                </div>
              </div>
            </div>

            {/* Affichage des pièces jointes */}
            {currentTraining.attachments && currentTraining.attachments.length > 0 && (
              <div className="attachments-section" style={{ marginBottom: "20px" }}>
                <h4>Documents de formation</h4>
                <div className="attachments-list">
                  {currentTraining.attachments.map((attachment) => (
                    <div
                      key={attachment._id}
                      className="attachment-item"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        marginBottom: "10px",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      <div>
                        <strong>{attachment.originalName}</strong>
                        <br />
                        <small className="text-muted">{(attachment.fileSize / 1024 / 1024).toFixed(2)} MB</small>
                      </div>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() =>
                          handleDownloadAttachment(currentTraining.id, attachment._id, attachment.originalName)
                        }
                      >
                        📄 Télécharger
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="training-content" style={{ marginBottom: "20px" }}>
              <h4>Contenu de la formation</h4>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  backgroundColor: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "5px",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {currentTraining.content}
              </div>
            </div>

            {!currentTraining.progress?.completed && (
              <div className="training-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateProgress}
                  disabled={currentTraining.progress?.percentage === 100}
                >
                  Marquer une progression (+10%)
                </button>
              </div>
            )}

            {currentTraining.progress?.completed && (
              <div className="alert alert-success">
                <strong>Formation terminée!</strong> Vous avez complété cette formation avec succès.
                <br />
                <small>Terminée le {new Date(currentTraining.progress.completedAt).toLocaleDateString()}</small>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ marginBottom: "20px", textAlign: "center", padding: "30px" }}>
            <h3>Aucune formation en cours</h3>
            <p>Vous n'avez pas de formation active pour le moment.</p>
          </div>
        )}

        <h2>Toutes mes formations</h2>

        {trainings.length > 0 ? (
          <div className="trainings-list">
            {trainings.map((training) => (
              <div key={training.id} className="card" style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3>{training.title}</h3>
                  <span className={`badge badge-${getStatusBadgeClass(training.progress)}`}>
                    {getStatusLabel(training.progress)}
                  </span>
                </div>

                <p>{training.description}</p>
                <p>
                  <strong>Durée:</strong> {training.duration} jours
                </p>

                {/* Affichage des pièces jointes dans la liste */}
                {training.attachments && training.attachments.length > 0 && (
                  <p>
                    <strong>Documents:</strong> {training.attachments.length} fichier(s) PDF disponible(s)
                  </p>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    {training.progress?.startedAt && (
                      <p>
                        <strong>Commencé le:</strong> {new Date(training.progress.startedAt).toLocaleDateString()}
                      </p>
                    )}
                    {training.progress?.completedAt && (
                      <p>
                        <strong>Terminé le:</strong> {new Date(training.progress.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {!training.progress && (
                    <button className="btn btn-primary" onClick={() => handleStartTraining(training.id)}>
                      Commencer
                    </button>
                  )}

                  {training.progress && !training.progress.completed && !currentTraining && (
                    <button className="btn btn-success" onClick={() => setCurrentTraining(training)}>
                      Continuer
                    </button>
                  )}
                </div>

                {training.progress && (
                  <div className="progress" style={{ marginTop: "10px" }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${training.progress.percentage || 0}%` }}
                      aria-valuenow={training.progress.percentage || 0}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {training.progress.percentage || 0}%
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "30px" }}>
            <h3>Aucune formation assignée</h3>
            <p>Aucune formation ne vous a été assignée pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Fonctions utilitaires
function getStatusLabel(progress) {
  if (!progress) return "Non démarrée"
  if (progress.completed) return "Terminée"
  if (progress.percentage > 0) return "En cours"
  return "Assignée"
}

function getStatusBadgeClass(progress) {
  if (!progress) return "secondary"
  if (progress.completed) return "success"
  if (progress.percentage > 0) return "info"
  return "warning"
}

export default Trainings
