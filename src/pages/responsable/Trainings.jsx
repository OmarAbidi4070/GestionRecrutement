"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Trainings() {
  const [trainings, setTrainings] = useState([])
  const [candidates, setCandidates] = useState([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    duration: 7,
  })
  const [showForm, setShowForm] = useState(false)
  const [selectedTraining, setSelectedTraining] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainingsResponse, candidatesResponse] = await Promise.all([
          axios.get("/api/responsable/trainings"),
          axios.get("/api/responsable/candidates?testFailed=true"),
        ])

        setTrainings(trainingsResponse.data)
        setCandidates(candidatesResponse.data)
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError("")

      const response = await axios.post("/api/responsable/trainings", formData)

      setTrainings([response.data, ...trainings])
      setSuccess("Formation créée avec succès")
      setFormData({
        title: "",
        description: "",
        content: "",
        duration: 7,
      })
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
      await axios.post("/api/responsable/assign-training", {
        userId: selectedCandidate,
        trainingId: selectedTraining._id,
      })

      setSuccess("Formation assignée avec succès")
      setSelectedCandidate("")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'assignation de la formation")
      console.error(err)
    }
  }

  const handleCloseDetails = () => {
    setSelectedTraining(null)
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

        <div style={{ marginBottom: "20px" }}>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Annuler" : "Créer une formation"}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3>Nouvelle formation</h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Titre</label>
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
                <label htmlFor="description">Description</label>
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
                <label htmlFor="content">Contenu</label>
                <textarea
                  id="content"
                  name="content"
                  className="form-control"
                  value={formData.content}
                  onChange={handleChange}
                  rows="5"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Durée (jours)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  className="form-control"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  required
                />
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
              <div style={{ whiteSpace: "pre-wrap" }}>{selectedTraining.content}</div>
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
                    <h3>{training.title}</h3>
                    <p>{training.description}</p>
                    <p>
                      <strong>Durée:</strong> {training.duration} jours
                    </p>
                    <p className="text-muted">Créée le {new Date(training.createdAt).toLocaleDateString()}</p>

                    <div className="training-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleSelectTraining(training)}>
                        Voir détails / Assigner
                      </button>
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
