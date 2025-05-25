"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function CandidatesEnhanced() {
  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [tests, setTests] = useState([])
  const [testResults, setTestResults] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("list") // "list", "details"

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
        const [candidatesResponse, testsResponse, resultsResponse] = await Promise.all([
          axios.get("/api/responsable/candidates", { headers: getAuthHeaders() }),
          axios.get("/api/responsable/tests", { headers: getAuthHeaders() }),
          axios.get("/api/responsable/test-results", { headers: getAuthHeaders() }),
        ])

        setCandidates(candidatesResponse.data)
        setTests(testsResponse.data)
        setTestResults(resultsResponse.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des données")
        setLoading(false)
        console.error(err)
      }
    }

    fetchData()
  }, [])

  const handleViewCandidate = async (candidate) => {
    try {
      setLoading(true)
      // Récupérer les documents du candidat
      const documentsResponse = await axios.get(`/api/responsable/candidates/${candidate._id}/documents`, {
        headers: getAuthHeaders(),
      })
      setDocuments(documentsResponse.data)
      setSelectedCandidate(candidate)
      setActiveTab("details")
      setLoading(false)
    } catch (err) {
      setError("Erreur lors du chargement des détails du candidat")
      setLoading(false)
      console.error(err)
    }
  }

  const handleVerifyDocument = async (documentId, status) => {
    try {
      await axios.put(`/api/responsable/documents/${documentId}/verify`, { status }, { headers: getAuthHeaders() })

      // Mettre à jour la liste des documents
      setDocuments(documents.map((doc) => (doc._id === documentId ? { ...doc, status } : doc)))
      setSuccess(`Document ${status === "approved" ? "approuvé" : "rejeté"} avec succès`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la vérification du document")
      console.error(err)
    }
  }

  const getCandidateTestStatus = (candidateId) => {
    const candidateResults = testResults.filter((result) => result.userId._id === candidateId)
    if (candidateResults.length === 0) return { status: "none", label: "Aucun test", color: "#6c757d" }

    const latestResult = candidateResults[candidateResults.length - 1]
    if (latestResult.status === "assigned") return { status: "assigned", label: "Test assigné", color: "#17a2b8" }
    if (latestResult.status === "started") return { status: "started", label: "En cours", color: "#ffc107" }
    if (latestResult.status === "completed") {
      return latestResult.passed
        ? { status: "passed", label: "Réussi", color: "#28a745" }
        : { status: "failed", label: "Échoué", color: "#dc3545" }
    }

    return { status: "unknown", label: "Statut inconnu", color: "#6c757d" }
  }

  const getCandidateDocumentStatus = (candidateId) => {
    const candidateDocuments = documents.filter((doc) => doc.userId === candidateId)
    if (candidateDocuments.length === 0) return { status: "none", label: "Aucun document", color: "#6c757d" }

    const hasRejected = candidateDocuments.some((doc) => doc.status === "rejected")
    const allApproved = candidateDocuments.every((doc) => doc.status === "approved")
    const hasPending = candidateDocuments.some((doc) => doc.status === "pending")

    if (hasRejected) return { status: "rejected", label: "Documents rejetés", color: "#dc3545" }
    if (allApproved) return { status: "approved", label: "Documents approuvés", color: "#28a745" }
    if (hasPending) return { status: "pending", label: "En attente", color: "#ffc107" }

    return { status: "unknown", label: "Statut inconnu", color: "#6c757d" }
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
        <h1>Gestion Avancée des Candidats</h1>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {activeTab === "list" ? (
          <div>
            <div className="candidates-summary" style={{ marginBottom: "20px" }}>
              <div
                className="summary-cards"
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}
              >
                <div className="card" style={{ padding: "15px", textAlign: "center" }}>
                  <h3 style={{ color: "#007bff" }}>{candidates.length}</h3>
                  <p>Total Candidats</p>
                </div>
                <div className="card" style={{ padding: "15px", textAlign: "center" }}>
                  <h3 style={{ color: "#28a745" }}>
                    {candidates.filter((c) => getCandidateTestStatus(c._id).status === "passed").length}
                  </h3>
                  <p>Tests Réussis</p>
                </div>
                <div className="card" style={{ padding: "15px", textAlign: "center" }}>
                  <h3 style={{ color: "#dc3545" }}>
                    {candidates.filter((c) => getCandidateTestStatus(c._id).status === "failed").length}
                  </h3>
                  <p>Tests Échoués</p>
                </div>
                <div className="card" style={{ padding: "15px", textAlign: "center" }}>
                  <h3 style={{ color: "#ffc107" }}>
                    {candidates.filter((c) => getCandidateTestStatus(c._id).status === "none").length}
                  </h3>
                  <p>Sans Test</p>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <h3>Liste des Candidats</h3>
              {candidates.length > 0 ? (
                <div className="table-responsive">
                  <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Candidat</th>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Email</th>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Date d'inscription</th>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Documents</th>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Statut Test</th>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((candidate) => {
                        const testStatus = getCandidateTestStatus(candidate._id)
                        const docStatus = getCandidateDocumentStatus(candidate._id)

                        return (
                          <tr key={candidate._id}>
                            <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                              <strong>
                                {candidate.firstName} {candidate.lastName}
                              </strong>
                            </td>
                            <td style={{ padding: "12px", border: "1px solid #ddd" }}>{candidate.email}</td>
                            <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                              {new Date(candidate.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                              <span
                                style={{
                                  backgroundColor: docStatus.color,
                                  color: "white",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "0.8rem",
                                }}
                              >
                                {docStatus.label}
                              </span>
                            </td>
                            <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                              <span
                                style={{
                                  backgroundColor: testStatus.color,
                                  color: "white",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "0.8rem",
                                }}
                              >
                                {testStatus.label}
                              </span>
                            </td>
                            <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleViewCandidate(candidate)}
                                style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                              >
                                Voir Détails
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Aucun candidat disponible.</p>
              )}
            </div>
          </div>
        ) : (
          // Vue détaillée du candidat
          <div>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}
            >
              <h2>
                Détails: {selectedCandidate.firstName} {selectedCandidate.lastName}
              </h2>
              <button className="btn btn-secondary" onClick={() => setActiveTab("list")}>
                ← Retour à la liste
              </button>
            </div>

            {/* Informations personnelles */}
            <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
              <h3>Informations Personnelles</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <p>
                    <strong>Nom:</strong> {selectedCandidate.lastName}
                  </p>
                  <p>
                    <strong>Prénom:</strong> {selectedCandidate.firstName}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedCandidate.email}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Téléphone:</strong> {selectedCandidate.phone || "Non renseigné"}
                  </p>
                  <p>
                    <strong>Adresse:</strong> {selectedCandidate.address || "Non renseignée"}
                  </p>
                  <p>
                    <strong>Date d'inscription:</strong> {new Date(selectedCandidate.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
              <h3>Documents Soumis</h3>
              {documents.length > 0 ? (
                <div className="table-responsive">
                  <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Type</th>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Date de soumission</th>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Statut</th>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc._id}>
                          <td style={{ padding: "12px", border: "1px solid #ddd" }}>{doc.title}</td>
                          <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                            <span
                              style={{
                                backgroundColor:
                                  doc.status === "approved"
                                    ? "#28a745"
                                    : doc.status === "rejected"
                                      ? "#dc3545"
                                      : "#ffc107",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.8rem",
                              }}
                            >
                              {doc.status === "approved"
                                ? "Approuvé"
                                : doc.status === "rejected"
                                  ? "Rejeté"
                                  : "En attente"}
                            </span>
                          </td>
                          <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                            {doc.status === "pending" && (
                              <div style={{ display: "flex", gap: "5px" }}>
                                <button
                                  className="btn btn-sm"
                                  style={{ backgroundColor: "#28a745", color: "white", padding: "4px 8px" }}
                                  onClick={() => handleVerifyDocument(doc._id, "approved")}
                                >
                                  Approuver
                                </button>
                                <button
                                  className="btn btn-sm"
                                  style={{ backgroundColor: "#dc3545", color: "white", padding: "4px 8px" }}
                                  onClick={() => handleVerifyDocument(doc._id, "rejected")}
                                >
                                  Rejeter
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Aucun document soumis par ce candidat.</p>
              )}
            </div>

            {/* Résultats de tests */}
            <div className="card" style={{ padding: "20px" }}>
              <h3>Résultats des Tests</h3>
              {testResults.filter((result) => result.userId._id === selectedCandidate._id).length > 0 ? (
                <div className="table-responsive">
                  <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Test</th>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Score</th>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Statut</th>
                        <th style={{ padding: "12px", border: "1px solid #ddd" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults
                        .filter((result) => result.userId._id === selectedCandidate._id)
                        .map((result) => (
                          <tr key={result._id}>
                            <td style={{ padding: "12px", border: "1px solid #ddd" }}>{result.testId.title}</td>
                            <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                              <strong>{result.score}%</strong>
                            </td>
                            <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                              <span
                                style={{
                                  backgroundColor: result.passed ? "#28a745" : "#dc3545",
                                  color: "white",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "0.8rem",
                                }}
                              >
                                {result.passed ? "Réussi" : "Échoué"}
                              </span>
                            </td>
                            <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                              {result.completedAt ? new Date(result.completedAt).toLocaleDateString() : "En cours"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Aucun test assigné à ce candidat.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CandidatesEnhanced
