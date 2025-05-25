"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    salary: "",
  })
  const [showForm, setShowForm] = useState(false)
  const [showApplications, setShowApplications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await axios.get("/api/admin/jobs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setJobs(response.data)
      setLoading(false)
    } catch (err) {
      setError("Erreur lors du chargement des offres d'emploi")
      setLoading(false)
      console.error(err)
    }
  }

  const fetchApplications = async (jobId) => {
    try {
      const response = await axios.get(`/api/admin/jobs/${jobId}/applications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setApplications(response.data)
    } catch (err) {
      setError("Erreur lors du chargement des candidatures")
      console.error(err)
    }
  }

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

      const response = await axios.post("/api/admin/jobs", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      await fetchJobs()
      setSuccess("Offre d'emploi créée avec succès")
      setFormData({
        title: "",
        description: "",
        requirements: "",
        location: "",
        salary: "",
      })
      setShowForm(false)

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création de l'offre d'emploi")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await axios.put(
        `/api/admin/jobs/${jobId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      )

      setJobs(jobs.map((job) => (job._id === jobId ? { ...job, status: newStatus } : job)))
      setSuccess(`Offre ${newStatus === "open" ? "ouverte" : "fermée"} avec succès`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Erreur lors de la mise à jour du statut")
      console.error(err)
    }
  }

  const handleViewApplications = (job) => {
    setSelectedJob(job)
    setShowApplications(true)
    fetchApplications(job._id)
  }

  const handleApplicationStatusChange = async (applicationId, newStatus) => {
    try {
      await axios.put(
        `/api/admin/applications/${applicationId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      )

      setApplications(applications.map((app) => (app._id === applicationId ? { ...app, status: newStatus } : app)))
      setSuccess(
        `Candidature ${newStatus === "accepted" ? "acceptée" : newStatus === "rejected" ? "rejetée" : "assignée"} avec succès`,
      )
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Erreur lors de la mise à jour de la candidature")
      console.error(err)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { class: "badge-success", text: "Ouvert" },
      closed: { class: "badge-secondary", text: "Fermé" },
      pending: { class: "badge-warning", text: "En attente" },
      accepted: { class: "badge-info", text: "Acceptée" },
      rejected: { class: "badge-danger", text: "Rejetée" },
      assigned: { class: "badge-success", text: "Assignée" },
    }

    const config = statusConfig[status] || { class: "badge-secondary", text: status }
    return <span className={`badge ${config.class}`}>{config.text}</span>
  }

  if (showApplications && selectedJob) {
    return (
      <div className="dashboard">
        <Sidebar role="admin" />
        <div className="main-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1>Candidatures - {selectedJob.title}</h1>
            <button className="btn btn-secondary" onClick={() => setShowApplications(false)}>
              ← Retour aux offres
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="card">
            <h3>Détails de l'offre</h3>
            <p>
              <strong>Titre:</strong> {selectedJob.title}
            </p>
            <p>
              <strong>Lieu:</strong> {selectedJob.location}
            </p>
            <p>
              <strong>Statut:</strong> {getStatusBadge(selectedJob.status)}
            </p>
          </div>

          <div className="card" style={{ marginTop: "20px" }}>
            <h3>Candidatures ({applications.length})</h3>

            {applications.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Candidat</th>
                      <th>Email</th>
                      <th>Téléphone</th>
                      <th>Date de candidature</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((application) => (
                      <tr key={application._id}>
                        <td>
                          {application.userId.firstName} {application.userId.lastName}
                        </td>
                        <td>{application.userId.email}</td>
                        <td>{application.userId.phone || "Non renseigné"}</td>
                        <td>{new Date(application.appliedAt).toLocaleDateString()}</td>
                        <td>{getStatusBadge(application.status)}</td>
                        <td>
                          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                            {application.status === "pending" && (
                              <>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleApplicationStatusChange(application._id, "accepted")}
                                >
                                  Accepter
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleApplicationStatusChange(application._id, "rejected")}
                                >
                                  Rejeter
                                </button>
                              </>
                            )}
                            {application.status === "accepted" && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleApplicationStatusChange(application._id, "assigned")}
                              >
                                Assigner
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Aucune candidature pour cette offre.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Sidebar role="admin" />

      <div className="main-content">
        <h1>Gestion des offres d'emploi</h1>

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
                <label htmlFor="title">Titre du poste *</label>
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

              <div className="form-group">
                <label htmlFor="salary">Salaire</label>
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  className="form-control"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Ex: 30 000 - 40 000 €"
                />
              </div>

              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? "Création en cours..." : "Créer l'offre"}
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <h3>Liste des offres d'emploi ({jobs.length})</h3>

          {loading ? (
            <p>Chargement des offres d'emploi...</p>
          ) : jobs.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Lieu</th>
                    <th>Salaire</th>
                    <th>Statut</th>
                    <th>Date de création</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job._id}>
                      <td>
                        <strong>{job.title}</strong>
                      </td>
                      <td>{job.location || "Non spécifié"}</td>
                      <td>{job.salary || "Non spécifié"}</td>
                      <td>{getStatusBadge(job.status)}</td>
                      <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                          <button className="btn btn-info btn-sm" onClick={() => handleViewApplications(job)}>
                            Candidatures
                          </button>
                          <button
                            className={`btn btn-sm ${job.status === "open" ? "btn-warning" : "btn-success"}`}
                            onClick={() => handleStatusChange(job._id, job.status === "open" ? "closed" : "open")}
                          >
                            {job.status === "open" ? "Fermer" : "Ouvrir"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Aucune offre d'emploi disponible</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Jobs
