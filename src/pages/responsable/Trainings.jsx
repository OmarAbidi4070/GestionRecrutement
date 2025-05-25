"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Trainings() {
  const [trainings, setTrainings] = useState([])
  const [candidates, setCandidates] = useState([])
  const [trainingProgress, setTrainingProgress] = useState([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    duration: 7,
  })
  const [attachments, setAttachments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedTraining, setSelectedTraining] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState("")
  const [showProgress, setShowProgress] = useState(false)
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
    const fetchData = async () => {
      try {
        const [trainingsResponse, candidatesResponse, progressResponse] = await Promise.all([
          axios.get("/api/responsable/trainings", { headers: getAuthHeaders() }),
          axios.get("/api/responsable/candidates", { headers: getAuthHeaders() }),
          axios.get("/api/responsable/training-progress", { headers: getAuthHeaders() }),
        ])

        setTrainings(trainingsResponse.data)
        setCandidates(candidatesResponse.data.filter((candidate) => candidate.role === "worker"))
        setTrainingProgress(progressResponse.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des données")
        setLoading(false)
        console.error(err)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)

    // Vérifier que tous les fichiers sont des PDF
    const invalidFiles = files.filter((file) => file.type !== "application/pdf")
    if (invalidFiles.length > 0) {
      setError("Seuls les fichiers PDF sont acceptés")
      return
    }

    // Vérifier la taille des fichiers (max 5MB chacun)
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError("Chaque fichier ne doit pas dépasser 5MB")
      return
    }

    setAttachments(files)
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError("")

      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("content", formData.content)
      formDataToSend.append("duration", formData.duration)

      // Ajouter les pièces jointes
      attachments.forEach((file) => {
        formDataToSend.append("attachments", file)
      })

      const response = await axios.post("/api/responsable/trainings", formDataToSend, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      })

      setTrainings([response.data.training, ...trainings])
      setSuccess("Formation créée avec succès")
      setFormData({
        title: "",
        description: "",
        content: "",
        duration: 7,
      })
      setAttachments([])
      setShowForm(false)

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création de la formation")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTraining = (training) => {
    setSelectedTraining(training)
    setSelectedCandidate("")
  }

  const handleAssignTraining = async () => {
    if (!selectedTraining || !selectedCandidate) {
      return setError("Veuillez sélectionner un candidat")
    }

    try {
      await axios.post(
        "/api/responsable/assign-training",
        {
          userId: selectedCandidate,
          trainingId: selectedTraining._id,
        },
        { headers: getAuthHeaders() },
      )

      setSuccess("Formation assignée avec succès")
      setSelectedCandidate("")

      // Recharger les données de progression
      const progressResponse = await axios.get("/api/responsable/training-progress", { headers: getAuthHeaders() })
      setTrainingProgress(progressResponse.data)

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'assignation de la formation")
      console.error(err)
    }
  }

  const handleCloseDetails = () => {
    setSelectedTraining(null)
  }

  const handleDeleteTraining = async (trainingId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")) {
      return
    }

    try {
      await axios.delete(`/api/responsable/trainings/${trainingId}`, {
        headers: getAuthHeaders(),
      })

      setTrainings(trainings.filter((training) => training._id !== trainingId))
      setSuccess("Formation supprimée avec succès")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression")
      console.error(err)
    }
  }

  const getProgressForTraining = (trainingId) => {
    return trainingProgress.filter((p) => p.trainingId._id === trainingId)
  }

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar role="responsable" />
        <div className="main-content">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Sidebar role="responsable" />

      <div className="main-content">
        <h1>Formations</h1>
        <p>Gérez les formations et assignez-les aux candidats</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Annuler" : "Créer une formation"}
          </button>
          <button className="btn btn-info" onClick={() => setShowProgress(!showProgress)}>
            {showProgress ? "Masquer progression" : "Voir progression"}
          </button>
        </div>

        {showProgress && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3>Progression des formations</h3>
            {trainingProgress.length > 0 ? (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Candidat</th>
                      <th>Formation</th>
                      <th>Progression</th>
                      <th>Statut</th>
                      <th>Date début</th>
                      <th>Date fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingProgress.map((progress) => (
                      <tr key={progress._id}>
                        <td>
                          {progress.userId.firstName} {progress.userId.lastName}
                          <br />
                          <small className="text-muted">{progress.userId.email}</small>
                        </td>
                        <td>{progress.trainingId.title}</td>
                        <td>
                          <div className="progress" style={{ width: "100px" }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{ width: `${progress.progress}%` }}
                              aria-valuenow={progress.progress}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            >
                              {progress.progress}%
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${progress.completed ? "success" : "warning"}`}>
                            {progress.completed ? "Terminée" : "En cours"}
                          </span>
                        </td>
                        <td>{new Date(progress.startedAt).toLocaleDateString()}</td>
                        <td>{progress.completedAt ? new Date(progress.completedAt).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Aucune progression de formation disponible.</p>
            )}
          </div>
        )}

        {showForm && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3>Nouvelle formation</h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Titre *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">Contenu de la formation *</label>
                <textarea
                  id="content"
                  name="content"
                  className="form-control"
                  value={formData.content}
                  onChange={handleChange}
                  rows="8"
                  placeholder="Décrivez le contenu détaillé de la formation..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Durée estimée (jours) *</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  className="form-control"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  max="365"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="attachments">Pièces jointes (PDF uniquement)</label>
                <input
                  type="file"
                  id="attachments"
                  className="form-control"
                  onChange={handleFileChange}
                  multiple
                  accept=".pdf"
                />
                <small className="text-muted">Vous pouvez sélectionner plusieurs fichiers PDF (max 5MB chacun)</small>
                {attachments.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <strong>Fichiers sélectionnés:</strong>
                    <ul>
                      {attachments.map((file, index) => (
                        <li key={index}>
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? "Création en cours..." : "Créer la formation"}
              </button>
            </form>
          </div>
        )}

        {selectedTraining ? (
          <div className="training-details">
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}
            >
              <h2>Détails de la formation: {selectedTraining.title}</h2>
              <button className="btn btn-secondary" onClick={handleCloseDetails}>
                Retour à la liste
              </button>
            </div>

            <div className="card" style={{ marginBottom: "20px" }}>
              <h3>Informations</h3>
              <p>
                <strong>Description:</strong> {selectedTraining.description}
              </p>
              <p>
                <strong>Durée:</strong> {selectedTraining.duration} jours
              </p>
              <p>
                <strong>Date de création:</strong> {new Date(selectedTraining.createdAt).toLocaleDateString()}
              </p>

              <h4 style={{ marginTop: "20px" }}>Contenu</h4>
              <div style={{ whiteSpace: "pre-wrap", backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "5px" }}>
                {selectedTraining.content}
              </div>

              {selectedTraining.attachments && selectedTraining.attachments.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <h4>Pièces jointes</h4>
                  <div className="attachments-list">
                    {selectedTraining.attachments.map((attachment) => (
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
                        }}
                      >
                        <div>
                          <strong>{attachment.originalName}</strong>
                          <br />
                          <small className="text-muted">
                            {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB - Ajouté le{" "}
                            {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </small>
                        </div>
                        <a
                          href={`/api/training/${selectedTraining._id}/attachment/${attachment._id}?token=${localStorage.getItem("token")}`}
                          className="btn btn-sm btn-outline-primary"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Télécharger
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card" style={{ marginBottom: "20px" }}>
              <h3>Progression pour cette formation</h3>
              {getProgressForTraining(selectedTraining._id).length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Candidat</th>
                        <th>Progression</th>
                        <th>Statut</th>
                        <th>Date début</th>
                        <th>Date fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getProgressForTraining(selectedTraining._id).map((progress) => (
                        <tr key={progress._id}>
                          <td>
                            {progress.userId.firstName} {progress.userId.lastName}
                            <br />
                            <small className="text-muted">{progress.userId.email}</small>
                          </td>
                          <td>
                            <div className="progress" style={{ width: "100px" }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{ width: `${progress.progress}%` }}
                                aria-valuenow={progress.progress}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              >
                                {progress.progress}%
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${progress.completed ? "success" : "warning"}`}>
                              {progress.completed ? "Terminée" : "En cours"}
                            </span>
                          </td>
                          <td>{new Date(progress.startedAt).toLocaleDateString()}</td>
                          <td>{progress.completedAt ? new Date(progress.completedAt).toLocaleDateString() : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Aucun candidat n'a encore été assigné à cette formation.</p>
              )}
            </div>

            <div className="card">
              <h3>Assigner cette formation</h3>

              {candidates.length > 0 ? (
                <div>
                  <div className="form-group">
                    <label htmlFor="candidateSelect">Sélectionner un candidat</label>
                    <select
                      id="candidateSelect"
                      className="form-control"
                      value={selectedCandidate}
                      onChange={(e) => setSelectedCandidate(e.target.value)}
                    >
                      <option value="">-- Sélectionner un candidat --</option>
                      {candidates.map((candidate) => (
                        <option key={candidate._id} value={candidate._id}>
                          {candidate.firstName} {candidate.lastName} - {candidate.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-primary" onClick={handleAssignTraining} disabled={!selectedCandidate}>
                    Assigner la formation
                  </button>
                </div>
              ) : (
                <p>Aucun candidat disponible pour cette formation.</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h2>Liste des formations</h2>

            {trainings.length > 0 ? (
              <div className="trainings-list">
                {trainings.map((training) => (
                  <div key={training._id} className="card" style={{ marginBottom: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <h3>{training.title}</h3>
                        <p>{training.description}</p>
                        <p>
                          <strong>Durée:</strong> {training.duration} jours
                        </p>
                        {training.attachments && training.attachments.length > 0 && (
                          <p>
                            <strong>Pièces jointes:</strong> {training.attachments.length} fichier(s) PDF
                          </p>
                        )}
                        <p className="text-muted">Créée le {new Date(training.createdAt).toLocaleDateString()}</p>

                        {/* Afficher le nombre de candidats assignés */}
                        <p>
                          <strong>Candidats assignés:</strong> {getProgressForTraining(training._id).length}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleSelectTraining(training)}>
                          Voir détails / Assigner
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTraining(training._id)}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "30px" }}>
                <h3>Aucune formation disponible</h3>
                <p>Vous n'avez pas encore créé de formations.</p>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  Créer votre première formation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Trainings
