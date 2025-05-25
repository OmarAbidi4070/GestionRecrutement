"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [coverLetter, setCoverLetter] = useState("")
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [showMyApplications, setShowMyApplications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchJobs()
    fetchMyApplications()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await axios.get("/api/worker/jobs", {
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

  const fetchMyApplications = async () => {
    try {
      const response = await axios.get("/api/worker/applications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setApplications(response.data)
    } catch (err) {
      console.error("Erreur lors du chargement des candidatures:", err)
    }
  }

  const handleApply = (job) => {
    setSelectedJob(job)
    setShowApplicationForm(true)
    setCoverLetter("")
  }

  const handleSubmitApplication = async (e) => {
    e.preventDefault()

    if (!coverLetter.trim()) {
      setError("Veuillez rédiger une lettre de motivation")
      return
    }

    try {
      setLoading(true)
      setError("")

      await axios.post(
        `/api/worker/jobs/${selectedJob._id}/apply`,
        { coverLetter },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      )

      setSuccess("Candidature soumise avec succès !")
      setShowApplicationForm(false)
      setCoverLetter("")
      setSelectedJob(null)

      // Rafraîchir les données
      await fetchJobs()
      await fetchMyApplications()

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la soumission de la candidature")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: "badge-warning", text: "En attente" },
      accepted: { class: "badge-info", text: "Acceptée" },
      rejected: { class: "badge-danger", text: "Rejetée" },
      assigned: { class: "badge-success", text: "Assignée" },
    }

    const config = statusConfig[status] || { class: "badge-secondary", text: status }
    return <span className={`badge ${config.class}`}>{config.text}</span>
  }

  if (showMyApplications) {
    return (
      <div className="dashboard">
        <Sidebar role="worker" />
        <div className="main-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1>Mes candidatures</h1>
            <button className="btn btn-secondary" onClick={() => setShowMyApplications(false)}>
              ← Retour aux offres
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="card">
            <h3>Historique de mes candidatures ({applications.length})</h3>

            {applications.length > 0 ? (
              <div className="applications-list">
                {applications.map((application) => (
                  <div key={application._id} className="card" style={{ marginBottom: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <h4>{application.jobId.title}</h4>
                        <p>
                          <strong>Lieu:</strong> {application.jobId.location || "Non spécifié"}
                        </p>
                        <p>
                          <strong>Date de candidature:</strong> {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Statut de l'offre:</strong>
                          <span
                            className={`badge ${application.jobId.status === "open" ? "badge-success" : "badge-secondary"}`}
                            style={{ marginLeft: "10px" }}
                          >
                            {application.jobId.status === "open" ? "Ouverte" : "Fermée"}
                          </span>
                        </p>
                      </div>
                      <div>{getStatusBadge(application.status)}</div>
                    </div>

                    <div style={{ marginTop: "15px" }}>
                      <h5>Ma lettre de motivation:</h5>
                      <p
                        style={{
                          backgroundColor: "#f8f9fa",
                          padding: "10px",
                          borderRadius: "5px",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {application.coverLetter}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Vous n'avez encore postulé à aucune offre.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (showApplicationForm && selectedJob) {
    return (
      <div className="dashboard">
        <Sidebar role="worker" />
        <div className="main-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1>Postuler - {selectedJob.title}</h1>
            <button className="btn btn-secondary" onClick={() => setShowApplicationForm(false)}>
              ← Retour
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="card" style={{ marginBottom: "20px" }}>
            <h3>Détails de l'offre</h3>
            <p>
              <strong>Titre:</strong> {selectedJob.title}
            </p>
            <p>
              <strong>Lieu:</strong> {selectedJob.location || "Non spécifié"}
            </p>
            <p>
              <strong>Salaire:</strong> {selectedJob.salary || "Non spécifié"}
            </p>
            <div>
              <strong>Description:</strong>
              <p style={{ marginTop: "10px", whiteSpace: "pre-wrap" }}>{selectedJob.description}</p>
            </div>
            {selectedJob.requirements && (
              <div>
                <strong>Exigences:</strong>
                <p style={{ marginTop: "10px", whiteSpace: "pre-wrap" }}>{selectedJob.requirements}</p>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Lettre de motivation</h3>
            <form onSubmit={handleSubmitApplication}>
              <div className="form-group">
                <label htmlFor="coverLetter">Expliquez pourquoi vous êtes intéressé(e) par ce poste *</label>
                <textarea
                  id="coverLetter"
                  className="form-control"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows="8"
                  placeholder="Rédigez votre lettre de motivation ici..."
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? "Envoi en cours..." : "Envoyer ma candidature"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplicationForm(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Sidebar role="worker" />

      <div className="main-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1>Offres d'emploi disponibles</h1>
          <button className="btn btn-info" onClick={() => setShowMyApplications(true)}>
            Mes candidatures ({applications.length})
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <p>Chargement des offres d'emploi...</p>
        ) : jobs.length > 0 ? (
          <div className="jobs-list">
            {jobs.map((job) => (
              <div key={job._id} className="card" style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <h3>{job.title}</h3>
                    <p>
                      <strong>Lieu:</strong> {job.location || "Non spécifié"}
                    </p>
                    {job.salary && (
                      <p>
                        <strong>Salaire:</strong> {job.salary}
                      </p>
                    )}

                    <div style={{ marginTop: "15px" }}>
                      <strong>Description:</strong>
                      <p style={{ marginTop: "5px" }}>{job.description}</p>
                    </div>

                    {job.requirements && (
                      <div style={{ marginTop: "15px" }}>
                        <strong>Exigences:</strong>
                        <p style={{ marginTop: "5px" }}>{job.requirements}</p>
                      </div>
                    )}

                    <p className="text-muted" style={{ marginTop: "15px" }}>
                      Publié le {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ marginLeft: "20px" }}>
                    {job.hasApplied ? (
                      <div style={{ textAlign: "center" }}>
                        <p style={{ margin: "0 0 10px 0" }}>Candidature envoyée</p>
                        {getStatusBadge(job.applicationStatus)}
                      </div>
                    ) : (
                      <button className="btn btn-primary" onClick={() => handleApply(job)}>
                        Postuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <p>Aucune offre d'emploi disponible pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Jobs
