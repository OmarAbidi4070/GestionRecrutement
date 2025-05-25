"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import { Users, FileText, CheckCircle, Clock, AlertTriangle, Search, Filter } from "lucide-react"

function TestAssignmentImproved() {
  const [candidates, setCandidates] = useState([])
  const [tests, setTests] = useState([])
  const [selectedCandidates, setSelectedCandidates] = useState([])
  const [selectedTest, setSelectedTest] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Fonction pour obtenir les headers d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [candidatesResponse, testsResponse] = await Promise.all([
        axios.get("/api/responsable/candidates", { headers: getAuthHeaders() }),
        axios.get("/api/responsable/tests", { headers: getAuthHeaders() }),
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

  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId],
    )
  }

  const handleSelectAll = () => {
    const filteredCandidates = getFilteredCandidates()
    const allSelected = filteredCandidates.every((candidate) => selectedCandidates.includes(candidate._id))

    if (allSelected) {
      setSelectedCandidates([])
    } else {
      setSelectedCandidates(filteredCandidates.map((candidate) => candidate._id))
    }
  }

  const handleAssignTest = async () => {
    if (selectedCandidates.length === 0) {
      setError("Veuillez sélectionner au moins un candidat")
      return
    }

    if (!selectedTest) {
      setError("Veuillez sélectionner un test")
      return
    }

    try {
      setLoading(true)
      setError("")

      const assignments = await Promise.all(
        selectedCandidates.map((candidateId) =>
          axios.post(
            "/api/responsable/assign-test",
            {
              userId: candidateId,
              testId: selectedTest,
            },
            { headers: getAuthHeaders() },
          ),
        ),
      )

      setSuccess(`Test assigné avec succès à ${selectedCandidates.length} candidat(s)`)
      setSelectedCandidates([])
      setSelectedTest("")
      setTimeout(() => setSuccess(""), 5000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'assignation du test")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredCandidates = () => {
    return candidates.filter((candidate) => {
      const matchesSearch =
        candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && candidate.status === "active") ||
        (statusFilter === "pending" && candidate.status === "pending")

      return matchesSearch && matchesStatus
    })
  }

  const getCandidateStatus = (candidate) => {
    // Cette fonction devrait être améliorée avec de vraies données de statut
    if (candidate.status === "active") {
      return { label: "Actif", color: "#28a745", icon: CheckCircle }
    } else if (candidate.status === "pending") {
      return { label: "En attente", color: "#ffc107", icon: Clock }
    } else {
      return { label: "Inactif", color: "#6c757d", icon: AlertTriangle }
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar role="responsable" />
        <div className="main-content">
          <div className="loading" style={{ textAlign: "center", padding: "50px" }}>
            <div style={{ fontSize: "18px", marginBottom: "10px" }}>Chargement...</div>
          </div>
        </div>
      </div>
    )
  }

  const filteredCandidates = getFilteredCandidates()

  return (
    <div className="dashboard">
      <Sidebar role="responsable" />

      <div className="main-content">
        <h1 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
          <Users size={28} />
          Assignation de Tests
        </h1>

        {error && (
          <div className="alert alert-danger" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Sélection du test */}
        <div className="card" style={{ padding: "25px", marginBottom: "25px" }}>
          <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText size={24} />
            Sélectionner un Test
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "20px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                Test à assigner <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <select
                className="form-control"
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                style={{ padding: "12px", fontSize: "16px" }}
              >
                <option value="">-- Sélectionner un test --</option>
                {tests.map((test) => (
                  <option key={test._id} value={test._id}>
                    {test.title} (Score requis: {test.passingScore}%)
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleAssignTest}
              disabled={!selectedTest || selectedCandidates.length === 0 || loading}
              style={{
                padding: "12px 25px",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle size={18} />
              Assigner le Test ({selectedCandidates.length})
            </button>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="card" style={{ padding: "20px", marginBottom: "25px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "20px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                <Search size={16} style={{ marginRight: "5px" }} />
                Rechercher un candidat
              </label>
              <input
                type="text"
                className="form-control"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, prénom ou email..."
                style={{ padding: "10px", fontSize: "16px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                <Filter size={16} style={{ marginRight: "5px" }} />
                Statut
              </label>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "10px", fontSize: "16px" }}
              >
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="pending">En attente</option>
              </select>
            </div>
            <button
              className="btn btn-outline-primary"
              onClick={handleSelectAll}
              style={{ padding: "10px 20px", fontSize: "16px" }}
            >
              {filteredCandidates.every((candidate) => selectedCandidates.includes(candidate._id))
                ? "Désélectionner tout"
                : "Sélectionner tout"}
            </button>
          </div>
        </div>

        {/* Liste des candidats */}
        <div className="card" style={{ padding: "25px" }}>
          <h3 style={{ marginBottom: "20px" }}>Candidats Disponibles ({filteredCandidates.length})</h3>

          {filteredCandidates.length > 0 ? (
            <div style={{ display: "grid", gap: "15px" }}>
              {filteredCandidates.map((candidate) => {
                const status = getCandidateStatus(candidate)
                const StatusIcon = status.icon
                const isSelected = selectedCandidates.includes(candidate._id)

                return (
                  <div
                    key={candidate._id}
                    className={`candidate-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleCandidateSelect(candidate._id)}
                    style={{
                      padding: "20px",
                      border: `2px solid ${isSelected ? "#007bff" : "#dee2e6"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#e7f3ff" : "#fff",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCandidateSelect(candidate._id)}
                        style={{ transform: "scale(1.2)" }}
                      />
                      <div>
                        <h5 style={{ margin: "0 0 5px 0" }}>
                          {candidate.firstName} {candidate.lastName}
                        </h5>
                        <p style={{ margin: "0", color: "#666" }}>{candidate.email}</p>
                        <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#666" }}>
                          Inscrit le: {new Date(candidate.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <StatusIcon size={18} style={{ color: status.color }} />
                      <span style={{ color: status.color, fontWeight: "bold" }}>{status.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              <Users size={48} style={{ marginBottom: "15px" }} />
              <p style={{ fontSize: "18px", margin: 0 }}>Aucun candidat trouvé</p>
              <p style={{ margin: "5px 0 0 0" }}>Essayez de modifier vos critères de recherche</p>
            </div>
          )}
        </div>

        {/* Résumé de la sélection */}
        {selectedCandidates.length > 0 && (
          <div
            className="card"
            style={{
              padding: "20px",
              marginTop: "25px",
              backgroundColor: "#e7f3ff",
              border: "2px solid #007bff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ margin: "0", color: "#007bff" }}>
                  {selectedCandidates.length} candidat(s) sélectionné(s)
                </h4>
                <p style={{ margin: "5px 0 0 0", color: "#666" }}>
                  {selectedTest
                    ? `Test sélectionné: ${tests.find((t) => t._id === selectedTest)?.title}`
                    : "Aucun test sélectionné"}
                </p>
              </div>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSelectedCandidates([])}
                style={{ padding: "8px 16px" }}
              >
                Effacer la sélection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TestAssignmentImproved
