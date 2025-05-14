"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Candidates() {
  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [tests, setTests] = useState([])
  const [selectedTest, setSelectedTest] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candidatesResponse, testsResponse] = await Promise.all([
          axios.get("/api/responsable/candidates"),
          axios.get("/api/responsable/tests"),
        ])

        setCandidates(candidatesResponse.data)
        setTests(testsResponse.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des données")
        setLoading(false)
        console.error(err)
      }
    }

    fetchData()
  }, [])

  const handleViewCandidate = (candidate) => {
    setSelectedCandidate(candidate)
  }

  const handleCloseDetails = () => {
    setSelectedCandidate(null)
  }

  const handleAssignTest = async () => {
    if (!selectedCandidate || !selectedTest) {
      return setError("Veuillez sélectionner un test à assigner")
    }

    try {
      await axios.post("/api/responsable/assign-test", {
        userId: selectedCandidate._id,
        testId: selectedTest,
      })

      // Mettre à jour le statut du candidat dans la liste
      setCandidates(
        candidates.map((candidate) =>
          candidate._id === selectedCandidate._id ? { ...candidate, testAssigned: true } : candidate,
        ),
      )

      setSuccess(`Test assigné avec succès à ${selectedCandidate.firstName} ${selectedCandidate.lastName}`)
      setSelectedTest("")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'assignation du test")
      console.error(err)
    }
  }

  const handleVerifyDocuments = async (candidateId, status) => {
    try {
      await axios.post(`/api/responsable/verify-documents/${candidateId}`, { status })

      // Mettre à jour le statut des documents du candidat dans la liste
      setCandidates(
        candidates.map((candidate) =>
          candidate._id === candidateId ? { ...candidate, documentsVerified: status === "verified" } : candidate,
        ),
      )

      if (selectedCandidate && selectedCandidate._id === candidateId) {
        setSelectedCandidate({
          ...selectedCandidate,
          documentsVerified: status === "verified",
        })
      }

      setSuccess(`Documents ${status === "verified" ? "vérifiés" : "rejetés"} avec succès`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la vérification des documents")
      console.error(err)
    }
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
        <h1>Candidatures</h1>
        <p>Gérez les candidatures et assignez des tests de niveau</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {selectedCandidate ? (
          <div className="candidate-details">
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}
            >
              <h2>
                Détails du candidat: {selectedCandidate.firstName} {selectedCandidate.lastName}
              </h2>
              <button className="btn btn-secondary" onClick={handleCloseDetails}>
                Retour à la liste
              </button>
            </div>

            <div className="card" style={{ marginBottom: "20px" }}>
              <h3>Informations personnelles</h3>
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

            <div className="card" style={{ marginBottom: "20px" }}>
              <h3>Documents</h3>
              {selectedCandidate.documents && selectedCandidate.documents.length > 0 ? (
                <div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Nom du fichier</th>
                        <th>Date</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCandidate.documents.map((doc) => (
                        <tr key={doc._id}>
                          <td>{doc.type}</td>
                          <td>{doc.filename}</td>
                          <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                          <td>{getDocumentStatusLabel(doc.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                    <button
                      className="btn btn-success"
                      onClick={() => handleVerifyDocuments(selectedCandidate._id, "verified")}
                      disabled={selectedCandidate.documentsVerified}
                    >
                      Valider les documents
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleVerifyDocuments(selectedCandidate._id, "rejected")}
                      disabled={selectedCandidate.documentsRejected}
                    >
                      Rejeter les documents
                    </button>
                  </div>
                </div>
              ) : (
                <p>Aucun document soumis par ce candidat.</p>
              )}
            </div>

            <div className="card">
              <h3>Assigner un test</h3>
              {selectedCandidate.testAssigned ? (
                <div>
                  <p>Un test a déjà été assigné à ce candidat.</p>
                  {selectedCandidate.testCompleted ? (
                    <div>
                      <p>
                        <strong>Résultat:</strong> {selectedCandidate.testScore}%
                      </p>
                      <p>
                        <strong>Statut:</strong>{" "}
                        {selectedCandidate.testPassed ? (
                          <span className="text-success">Test réussi</span>
                        ) : (
                          <span className="text-danger">Test échoué</span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p>Le candidat n'a pas encore complété le test.</p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="form-group">
                    <label htmlFor="testSelect">Sélectionner un test</label>
                    <select
                      id="testSelect"
                      className="form-control"
                      value={selectedTest}
                      onChange={(e) => setSelectedTest(e.target.value)}
                    >
                      <option value="">-- Sélectionner un test --</option>
                      {tests.map((test) => (
                        <option key={test._id} value={test._id}>
                          {test.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleAssignTest}
                    disabled={!selectedTest || !selectedCandidate.documentsVerified}
                  >
                    Assigner le test
                  </button>
                  {!selectedCandidate.documentsVerified && (
                    <p className="text-warning" style={{ marginTop: "10px" }}>
                      Les documents du candidat doivent être vérifiés avant de pouvoir assigner un test.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="card">
              <h3>Liste des candidats</h3>
              {candidates.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Date d'inscription</th>
                        <th>Documents</th>
                        <th>Test</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((candidate) => (
                        <tr key={candidate._id}>
                          <td>
                            {candidate.firstName} {candidate.lastName}
                          </td>
                          <td>{candidate.email}</td>
                          <td>{new Date(candidate.createdAt).toLocaleDateString()}</td>
                          <td>
                            {candidate.documentsSubmitted ? (
                              candidate.documentsVerified ? (
                                <span className="badge badge-success">Vérifiés</span>
                              ) : candidate.documentsRejected ? (
                                <span className="badge badge-danger">Rejetés</span>
                              ) : (
                                <span className="badge badge-warning">En attente</span>
                              )
                            ) : (
                              <span className="badge badge-secondary">Non soumis</span>
                            )}
                          </td>
                          <td>
                            {candidate.testAssigned ? (
                              candidate.testCompleted ? (
                                candidate.testPassed ? (
                                  <span className="badge badge-success">Réussi</span>
                                ) : (
                                  <span className="badge badge-danger">Échoué</span>
                                )
                              ) : (
                                <span className="badge badge-info">Assigné</span>
                              )
                            ) : (
                              <span className="badge badge-secondary">Non assigné</span>
                            )}
                          </td>
                          <td>
                            <button className="btn btn-primary btn-sm" onClick={() => handleViewCandidate(candidate)}>
                              Voir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Aucun candidat disponible.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Fonction utilitaire pour obtenir le libellé du statut d'un document
function getDocumentStatusLabel(status) {
  switch (status) {
    case "pending":
      return "En attente"
    case "verified":
      return "Vérifié"
    case "rejected":
      return "Rejeté"
    default:
      return status
  }
}

export default Candidates
