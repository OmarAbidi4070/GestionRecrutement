"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
  })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get("/api/admin/jobs")
        setJobs(response.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des offres d'emploi")
        setLoading(false)
        console.error(err)
      }
    }

    fetchJobs()
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

      const response = await axios.post("/api/admin/jobs", formData)

      setJobs([response.data, ...jobs])
      setSuccess("Offre d'emploi créée avec succès")
      setFormData({
        title: "",
        description: "",
        requirements: "",
        location: "",
      })
      setShowForm(false)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création de l'offre d'emploi")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <Sidebar role="admin" />

      <div className="main-content">
        <h1>Offres d'emploi</h1>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ marginBottom: "20px" }}>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Annuler" : "Ajouter une offre d'emploi"}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3>Nouvelle offre d'emploi</h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Titre du poste</label>
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
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="requirements">Exigences</label>
                <textarea
                  id="requirements"
                  name="requirements"
                  className="form-control"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Lieu</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className="form-control"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? "Création en cours..." : "Créer l'offre"}
              </button>
            </form>
          </div>
        )}

        <h2>Liste des offres d'emploi</h2>

        {loading ? (
          <p>Chargement des offres d'emploi...</p>
        ) : jobs.length > 0 ? (
          <div className="jobs-list">
            {jobs.map((job) => (
              <div key={job._id} className="card" style={{ marginBottom: "15px" }}>
                <h3>{job.title}</h3>
                <p>
                  <strong>Lieu:</strong> {job.location || "Non spécifié"}
                </p>
                <p>
                  <strong>Statut:</strong> {job.status === "open" ? "Ouvert" : "Fermé"}
                </p>
                <p>
                  <strong>Description:</strong>
                </p>
                <p>{job.description}</p>
                {job.requirements && (
                  <>
                    <p>
                      <strong>Exigences:</strong>
                    </p>
                    <p>{job.requirements}</p>
                  </>
                )}
                <p className="text-muted">Publié le {new Date(job.createdAt).toLocaleDateString()}</p>

                <div className="job-actions">
                  <button className="btn btn-secondary btn-sm">Modifier</button>
                  <button className="btn btn-danger btn-sm" style={{ marginLeft: "10px" }}>
                    {job.status === "open" ? "Fermer" : "Ouvrir"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Aucune offre d'emploi disponible</p>
        )}
      </div>
    </div>
  )
}

export default Jobs
