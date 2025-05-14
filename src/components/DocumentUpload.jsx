"use client"

import { useState } from "react"
import axios from "axios"

function DocumentUpload({ documentType, onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setError("")
  }

  const handleUpload = async () => {
    if (!file) {
      return setError("Veuillez sélectionner un fichier")
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return setError("Le fichier est trop volumineux (max 5MB)")
    }

    // Check file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      return setError("Type de fichier non supporté (PDF, JPEG, PNG uniquement)")
    }

    try {
      setUploading(true)
      setProgress(0)

      const formData = new FormData()
      formData.append("document", file)
      formData.append("type", documentType)

      const response = await axios.post("/api/worker/upload-document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setProgress(percentCompleted)
        },
      })

      setUploading(false)
      onUploadSuccess(response.data)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du téléchargement")
      setUploading(false)
      console.error(err)
    }
  }

  return (
    <div className="document-upload">
      <div className="form-group">
        <label htmlFor={`file-${documentType}`}>Sélectionner un fichier</label>
        <input
          type="file"
          id={`file-${documentType}`}
          className="form-control"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <small className="text-muted">Formats acceptés: PDF, JPEG, PNG (max 5MB)</small>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {uploading && (
        <div className="progress" style={{ marginTop: "10px", marginBottom: "10px" }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            {progress}%
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Téléchargement..." : "Télécharger"}
      </button>
    </div>
  )
}

export default DocumentUpload
