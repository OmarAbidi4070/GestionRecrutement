"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import DocumentUpload from "../../components/DocumentUpload"

function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get("/api/worker/documents")
        setDocuments(response.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des documents")
        setLoading(false)
        console.error(err)
      }
    }

    fetchDocuments()
  }, [])

  const handleUploadSuccess = (newDocument) => {
    setDocuments([...documents, newDocument])
    setSuccess("Document téléchargé avec succès")

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess("")
    }, 3000)
  }

  const getDocumentStatus = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge badge-warning">En attente</span>
      case "verified":
        return <span className="badge badge-success">Vérifié</span>
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
        <h1>Mes Documents</h1>
        <p>Téléchargez vos documents pour vérification</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card" style={{ marginTop: "20px" }}>
          <h3>Documents téléchargés</h3>

          {loading ? (
            <p>Chargement des documents...</p>
          ) : documents.length > 0 ? (
            <div className="table-container">
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
                  {documents.map((document) => (
                    <tr key={document._id}>
                      <td>{document.type}</td>
                      <td>{document.filename}</td>
                      <td>{new Date(document.createdAt).toLocaleDateString()}</td>
                      <td>{getDocumentStatus(document.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Aucun document téléchargé</p>
          )}
        </div>

        <div className="card" style={{ marginTop: "20px" }}>
          <h3>Télécharger un nouveau document</h3>

          <div className="document-types" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div className="document-type-card">
              <h4>CV</h4>
              <p>Téléchargez votre curriculum vitae</p>
              <DocumentUpload documentType="CV" onUploadSuccess={handleUploadSuccess} />
            </div>

            <div className="document-type-card">
              <h4>Diplôme</h4>
              <p>Téléchargez votre diplôme</p>
              <DocumentUpload documentType="Diplôme" onUploadSuccess={handleUploadSuccess} />
            </div>

            <div className="document-type-card">
              <h4>Attestation de travail</h4>
              <p>Téléchargez vos attestations de travail précédentes</p>
              <DocumentUpload documentType="Attestation" onUploadSuccess={handleUploadSuccess} />
            </div>

            <div className="document-type-card">
              <h4>Autre document</h4>
              <p>Téléchargez tout autre document pertinent</p>
              <DocumentUpload documentType="Autre" onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Documents
