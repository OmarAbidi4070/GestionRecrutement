"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
  })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axios.get("/api/worker/complaints")
        setComplaints(response.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des réclamations")
        setLoading(false)
        console.error(err)
      }
    }

    fetchComplaints()
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

      const response = await axios.post("/api/worker/complaints", formData)

      setComplaints([response.data, ...complaints])
      setSuccess("Réclamation soumise avec succès")
      setFormData({
        subject: "",
        description: "",
      })
      setShowForm(false)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la soumission de la réclamation")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge badge-warning">En attente</span>
      case "in_progress":
        return <span className="badge badge-info">En cours</span>
      case "resolved":
        return <span className="badge badge-success">Résolu</span>
      case "rejected":
        return <span className="badge badge-danger">Rejeté</span>
      default:
        return <span className="badge badge-secondary">Inconnu</span>
    }
  }

  return (
    <div className="dashboard">
      <Sidebar role="worker" />

      <div className="main-content">
        <h1>Réclamations</h1>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ marginBottom: "20px" }}>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Annuler" : "Nouvelle réclamation"}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3>Soumettre une réclamation</h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="subject">Sujet</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="form-control"
                  value={formData.subject}
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
                  rows="5"
                  required
                />
              </div>

              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? "Soumission en cours..." : "Soumettre"}
              </button>
            </form>
          </div>
        )}

        <h2>Mes réclamations</h2>

        {loading ? (
          <p>Chargement des réclamations...</p>
        ) : complaints.length > 0 ? (
          <div className="complaints-list">
            {complaints.map((complaint) => (
              <div key={complaint._id} className="card" style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3>{complaint.subject}</h3>
                  {getStatusBadge(complaint.status)}
                </div>
                <p>
                  <strong>Date:</strong> {new Date(complaint.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <strong>Description:</strong>
                </p>
                <p>{complaint.description}</p>

                {complaint.response && (
                  <>
                    <p>
                      <strong>Réponse:</strong>
                    </p>
                    <p>{complaint.response}</p>
                    <p>
                      <strong>Traité le:</strong> {new Date(complaint.handledAt).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>Aucune réclamation soumise</p>
        )}
      </div>
    </div>
  )
}

export default Complaints
