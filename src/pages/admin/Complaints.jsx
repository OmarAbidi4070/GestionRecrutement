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

  // Fonction pour obtenir les headers d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axios.get("/api/admin/complaints", {
          headers: getAuthHeaders(),
        })
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
    setError("")
    setSuccess("")
  }

  const handleResponseChange = (e) => {
    setResponseText(e.target.value)
  }

  const handleSubmitResponse = async (status) => {
    if (status === "resolved" && !responseText.trim()) {
      return setError("Veuillez fournir une réponse avant de résoudre la réclamation")
    }

    try {
      setError("")

      const response = await axios.post(
        `/api/admin/complaints/${selectedComplaint._id}/respond`,
        {
          response: responseText,
          status,
        },
        {
          headers: getAuthHeaders(),
        },
      )

      // Mettre à jour la liste des réclamations
      setComplaints(
        complaints.map((complaint) =>
          complaint._id === selectedComplaint._id
            ? {
                ...complaint,
                status,
                response: responseText,
                resolvedAt: new Date(),
              }
            : complaint,
        ),
      )

      // Mettre à jour la réclamation sélectionnée
      setSelectedComplaint({
        ...selectedComplaint,
        status,
        response: responseText,
        resolvedAt: new Date(),
      })

      setSuccess(`Réclamation ${getStatusLabel(status).toLowerCase()} avec succès`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du traitement de la réclamation")
      console.error(err)
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "En attente"
      case "in-progress":
        return "En cours"
      case "resolved":
        return "Résolue"
      case "rejected":
        return "Rejetée"
      default:
        return status
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "warning"
      case "in-progress":
        return "info"
      case "resolved":
        return "success"
      case "rejected":
        return "danger"
      default:
        return "secondary"
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
                    <strong>Email:</strong> {selectedComplaint.userId.email}
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
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    backgroundColor: "#f8f9fa",
                    padding: "15px",
                    borderRadius: "5px",
                    border: "1px solid #dee2e6",
                  }}
                >
                  {selectedComplaint.description}
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Réponse administrative</h3>

              {selectedComplaint.status === "pending" || selectedComplaint.status === "in-progress" ? (
                <div>
                  <div className="form-group">
                    <label htmlFor="responseText">Votre réponse :</label>
                    <textarea
                      id="responseText"
                      className="form-control"
                      rows="5"
                      value={responseText}
                      onChange={handleResponseChange}
                      placeholder="Entrez votre réponse détaillée ici..."
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                    <button
                      className="btn btn-success"
                      onClick={() => handleSubmitResponse("resolved")}
                      disabled={!responseText.trim()}
                    >
                      ✅ Résoudre
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleSubmitResponse("rejected")}
                      disabled={!responseText.trim()}
                    >
                      ❌ Rejeter
                    </button>
                    {selectedComplaint.status === "pending" && (
                      <button className="btn btn-info" onClick={() => handleSubmitResponse("in-progress")}>
                        🔄 Marquer en cours
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {selectedComplaint.response ? (
                    <div>
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          backgroundColor: "#f8f9fa",
                          padding: "15px",
                          borderRadius: "5px",
                          border: "1px solid #dee2e6",
                        }}
                      >
                        {selectedComplaint.response}
                      </div>
                      <p className="text-muted" style={{ marginTop: "10px" }}>
                        Réponse fournie le{" "}
                        {new Date(selectedComplaint.resolvedAt || selectedComplaint.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted">Aucune réponse fournie.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}
            >
              <h3>Liste des réclamations ({complaints.length})</h3>
              <div>
                <span className="badge badge-warning" style={{ marginRight: "10px" }}>
                  En attente: {complaints.filter((c) => c.status === "pending").length}
                </span>
                <span className="badge badge-info" style={{ marginRight: "10px" }}>
                  En cours: {complaints.filter((c) => c.status === "in-progress").length}
                </span>
                <span className="badge badge-success">
                  Résolues: {complaints.filter((c) => c.status === "resolved").length}
                </span>
              </div>
            </div>

            {complaints.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
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
                        <td>
                          <strong>{complaint.subject}</strong>
                          <br />
                          <small className="text-muted">{complaint.description.substring(0, 50)}...</small>
                        </td>
                        <td>
                          {complaint.userId.firstName} {complaint.userId.lastName}
                          <br />
                          <small className="text-muted">{complaint.userId.email}</small>
                        </td>
                        <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge badge-${getStatusBadgeClass(complaint.status)}`}>
                            {getStatusLabel(complaint.status)}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => handleSelectComplaint(complaint)}>
                            👁️ Voir détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <h5>Aucune réclamation</h5>
                <p className="text-muted">Aucune réclamation n'a été soumise pour le moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Complaints
