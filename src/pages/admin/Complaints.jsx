"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [responseText, setResponseText] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axios.get("/api/admin/complaints")
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

  const handleSelectComplaint = (complaint) => {
    setSelectedComplaint(complaint)
    setResponseText(complaint.response || "")
  }

  const handleCloseDetails = () => {
    setSelectedComplaint(null)
    setResponseText("")
  }

  const handleResponseChange = (e) => {
    setResponseText(e.target.value)
  }

  const handleSubmitResponse = async (status) => {
    if (status === "resolved" && !responseText.trim()) {
      return setError("Veuillez fournir une réponse avant de résoudre la réclamation")
    }

    try {
      await axios.post(`/api/admin/complaints/${selectedComplaint._id}/respond`, {
        response: responseText,
        status,
      })

      // Mettre à jour la liste des réclamations
      setComplaints(
        complaints.map((complaint) =>
          complaint._id === selectedComplaint._id
            ? {
                ...complaint,
                status,
                response: responseText,
                handledAt: new Date(),
              }
            : complaint,
        ),
      )

      // Mettre à jour la réclamation sélectionnée
      setSelectedComplaint({
        ...selectedComplaint,
        status,
        response: responseText,
        handledAt: new Date(),
      })

      setSuccess(`Réclamation ${status === "resolved" ? "résolue" : "rejetée"} avec succès`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du traitement de la réclamation")
      console.error(err)
    }
  }

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
        <h1>Gestion des réclamations</h1>
        <p>Traitez les réclamations soumises par les travailleurs</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {selectedComplaint ? (
          <div className="complaint-details">
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}
            >
              <h2>Détails de la réclamation</h2>
              <button className="btn btn-secondary" onClick={handleCloseDetails}>
                Retour à la liste
              </button>
            </div>

            <div className="card" style={{ marginBottom: "20px" }}>
              <h3>{selectedComplaint.subject}</h3>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}
              >
                <div>
                  <p>
                    <strong>Soumise par:</strong> {selectedComplaint.userId.firstName}{" "}
                    {selectedComplaint.userId.lastName}
                  </p>
                  <p>
                    <strong>Date:</strong> {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge badge-${getStatusBadgeClass(selectedComplaint.status)}`}>
                  {getStatusLabel(selectedComplaint.status)}
                </span>
              </div>
              <div style={{ marginTop: "20px" }}>
                <h4>Description</h4>
                <p style={{ whiteSpace: "pre-wrap" }}>{selectedComplaint.description}</p>
              </div>
            </div>

            <div className="card">
              <h3>Réponse</h3>

              {selectedComplaint.status === "pending" || selectedComplaint.status === "in_progress" ? (
                <div>
                  <div className="form-group">
                    <textarea
                      className="form-control"
                      rows="5"
                      value={responseText}
                      onChange={handleResponseChange}
                      placeholder="Entrez votre réponse ici..."
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-success" onClick={() => handleSubmitResponse("resolved")}>
                      Résoudre
                    </button>
                    <button className="btn btn-danger" onClick={() => handleSubmitResponse("rejected")}>
                      Rejeter
                    </button>
                    {selectedComplaint.status === "pending" && (
                      <button className="btn btn-info" onClick={() => handleSubmitResponse("in_progress")}>
                        Marquer en cours
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {selectedComplaint.response ? (
                    <div>
                      <p style={{ whiteSpace: "pre-wrap" }}>{selectedComplaint.response}</p>
                      <p className="text-muted">
                        Réponse fournie le {new Date(selectedComplaint.handledAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p>Aucune réponse fournie.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <h3>Liste des réclamations</h3>

            {complaints.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sujet</th>
                      <th>Soumise par</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((complaint) => (
                      <tr key={complaint._id}>
                        <td>{complaint.subject}</td>
                        <td>
                          {complaint.userId.firstName} {complaint.userId.lastName}
                        </td>
                        <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge badge-${getStatusBadgeClass(complaint.status)}`}>
                            {getStatusLabel(complaint.status)}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => handleSelectComplaint(complaint)}>
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Aucune réclamation disponible.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Fonctions utilitaires
function getStatusLabel(status) {
  switch (status) {
    case "pending":
      return "En attente"
    case "in_progress":
      return "En cours"
    case "resolved":
      return "Résolue"
    case "rejected":
      return "Rejetée"
    default:
      return status
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "pending":
      return "warning"
    case "in_progress":
      return "info"
    case "resolved":
      return "success"
    case "rejected":
      return "danger"
    default:
      return "secondary"
  }
}

export default Complaints
