"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate, useParams } from "react-router-dom"
import Sidebar from "../../components/Sidebar"
import { Plus, Trash2, Edit3, Save, Eye, ArrowLeft, FileText, CheckCircle, AlertTriangle } from "lucide-react"

function CreateTest() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [testData, setTestData] = useState({
    title: "",
    description: "",
    passingScore: 50,
    questions: [],
  })

  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1)

  // Fonction pour obtenir les headers d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  useEffect(() => {
    if (isEditing) {
      fetchTest()
    }
  }, [id, isEditing])

  const fetchTest = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/responsable/tests/${id}`, {
        headers: getAuthHeaders(),
      })
      setTestData(response.data)
      setLoading(false)
    } catch (err) {
      setError("Erreur lors du chargement du test")
      setLoading(false)
      console.error(err)
    }
  }

  const handleTestDataChange = (field, value) => {
    setTestData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleOptionChange = (index, field, value) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index
          ? { ...option, [field]: value }
          : { ...option, isCorrect: field === "isCorrect" ? false : option.isCorrect },
      ),
    }))
  }

  const addOption = () => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: [...prev.options, { text: "", isCorrect: false }],
    }))
  }

  const removeOption = (index) => {
    if (currentQuestion.options.length > 2) {
      setCurrentQuestion((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }))
    }
  }

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) {
      setError("Le texte de la question est requis")
      return
    }

    const validOptions = currentQuestion.options.filter((opt) => opt.text.trim())
    if (validOptions.length < 2) {
      setError("Au moins 2 options sont requises")
      return
    }

    const hasCorrectAnswer = validOptions.some((opt) => opt.isCorrect)
    if (!hasCorrectAnswer) {
      setError("Au moins une option doit être marquée comme correcte")
      return
    }

    const newQuestion = {
      text: currentQuestion.text.trim(),
      options: validOptions,
    }

    if (editingQuestionIndex >= 0) {
      setTestData((prev) => ({
        ...prev,
        questions: prev.questions.map((q, i) => (i === editingQuestionIndex ? newQuestion : q)),
      }))
      setEditingQuestionIndex(-1)
    } else {
      setTestData((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
      }))
    }

    setCurrentQuestion({
      text: "",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    })
    setError("")
  }

  const editQuestion = (index) => {
    setCurrentQuestion(testData.questions[index])
    setEditingQuestionIndex(index)
  }

  const removeQuestion = (index) => {
    setTestData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }))
  }

  const cancelEdit = () => {
    setCurrentQuestion({
      text: "",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    })
    setEditingQuestionIndex(-1)
  }

  const validateTest = () => {
    if (!testData.title.trim()) {
      setError("Le titre du test est requis")
      return false
    }

    if (testData.questions.length === 0) {
      setError("Au moins une question est requise")
      return false
    }

    if (testData.passingScore < 0 || testData.passingScore > 100) {
      setError("Le score de passage doit être entre 0 et 100")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateTest()) return

    try {
      setLoading(true)
      setError("")

      const url = isEditing ? `/api/responsable/tests/${id}` : "/api/responsable/tests"
      const method = isEditing ? "put" : "post"

      await axios[method](url, testData, {
        headers: getAuthHeaders(),
      })

      setSuccess(`Test ${isEditing ? "modifié" : "créé"} avec succès`)
      setTimeout(() => {
        navigate("/responsable/tests")
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || `Erreur lors de la ${isEditing ? "modification" : "création"} du test`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEditing) {
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

  return (
    <div className="dashboard">
      <Sidebar role="responsable" />

      <div className="main-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText size={28} />
            {isEditing ? "Modifier le Test" : "Créer un Nouveau Test"}
          </h1>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/responsable/tests")}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <ArrowLeft size={18} />
            Retour
          </button>
        </div>

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

        {/* Informations du test */}
        <div className="card" style={{ padding: "30px", marginBottom: "30px" }}>
          <h3 style={{ marginBottom: "25px" }}>Informations du Test</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                Titre du test <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={testData.title}
                onChange={(e) => handleTestDataChange("title", e.target.value)}
                placeholder="Ex: Test de niveau JavaScript"
                style={{ padding: "12px", fontSize: "16px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Score de passage (%)</label>
              <input
                type="number"
                className="form-control"
                value={testData.passingScore}
                onChange={(e) => handleTestDataChange("passingScore", Number.parseInt(e.target.value) || 0)}
                min="0"
                max="100"
                style={{ padding: "12px", fontSize: "16px" }}
              />
            </div>
          </div>
          <div style={{ marginTop: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Description</label>
            <textarea
              className="form-control"
              value={testData.description}
              onChange={(e) => handleTestDataChange("description", e.target.value)}
              placeholder="Description du test (optionnel)"
              rows="3"
              style={{ padding: "12px", fontSize: "16px", resize: "vertical" }}
            />
          </div>
        </div>

        {/* Ajout/Modification de question */}
        <div className="card" style={{ padding: "30px", marginBottom: "30px" }}>
          <h3 style={{ marginBottom: "25px" }}>
            {editingQuestionIndex >= 0 ? "Modifier la Question" : "Ajouter une Question"}
          </h3>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
              Question <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <textarea
              className="form-control"
              value={currentQuestion.text}
              onChange={(e) => handleQuestionChange("text", e.target.value)}
              placeholder="Tapez votre question ici..."
              rows="3"
              style={{ padding: "12px", fontSize: "16px", resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label style={{ display: "block", marginBottom: "15px", fontWeight: "bold" }}>
              Options de réponse <span style={{ color: "#dc3545" }}>*</span>
            </label>
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "15px",
                  padding: "15px",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  backgroundColor: option.isCorrect ? "#e7f3ff" : "#fff",
                }}
              >
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={option.isCorrect}
                  onChange={() => handleOptionChange(index, "isCorrect", true)}
                  style={{ transform: "scale(1.2)" }}
                />
                <input
                  type="text"
                  className="form-control"
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  style={{ flex: 1, padding: "10px", fontSize: "16px" }}
                />
                {currentQuestion.options.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeOption(index)}
                    style={{ padding: "8px" }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={addOption}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Plus size={18} />
              Ajouter une option
            </button>
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={addQuestion}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Save size={18} />
              {editingQuestionIndex >= 0 ? "Modifier la Question" : "Ajouter la Question"}
            </button>
            {editingQuestionIndex >= 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelEdit}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* Liste des questions */}
        {testData.questions.length > 0 && (
          <div className="card" style={{ padding: "30px", marginBottom: "30px" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}
            >
              <h3>Questions du Test ({testData.questions.length})</h3>
              <button
                className="btn btn-outline-info"
                onClick={() => setShowPreview(!showPreview)}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Eye size={18} />
                {showPreview ? "Masquer" : "Prévisualiser"}
              </button>
            </div>

            {showPreview ? (
              <div style={{ border: "2px dashed #007bff", borderRadius: "8px", padding: "20px" }}>
                <h4 style={{ color: "#007bff", marginBottom: "20px" }}>Prévisualisation du Test</h4>
                {testData.questions.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    style={{ marginBottom: "30px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}
                  >
                    <h5 style={{ marginBottom: "15px" }}>
                      Question {qIndex + 1}: {question.text}
                    </h5>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {question.options.map((option, oIndex) => (
                        <div
                          key={oIndex}
                          style={{
                            padding: "10px 15px",
                            border: `2px solid ${option.isCorrect ? "#28a745" : "#dee2e6"}`,
                            borderRadius: "6px",
                            backgroundColor: option.isCorrect ? "#d4edda" : "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <input type="radio" disabled />
                          <span>{option.text}</span>
                          {option.isCorrect && <span style={{ color: "#28a745", fontWeight: "bold" }}>(Correcte)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {testData.questions.map((question, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "20px",
                      border: "1px solid #dee2e6",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ marginBottom: "10px" }}>
                          Question {index + 1}: {question.text}
                        </h5>
                        <p style={{ color: "#666", margin: 0 }}>
                          {question.options.length} options • {question.options.filter((opt) => opt.isCorrect).length}{" "}
                          correcte(s)
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => editQuestion(index)}
                          style={{ display: "flex", alignItems: "center", gap: "5px" }}
                        >
                          <Edit3 size={14} />
                          Modifier
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeQuestion(index)}
                          style={{ display: "flex", alignItems: "center", gap: "5px" }}
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions finales */}
        <div className="card" style={{ padding: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: 0, color: "#007bff" }}>
                {testData.questions.length} question{testData.questions.length !== 1 ? "s" : ""} ajoutée
                {testData.questions.length !== 1 ? "s" : ""}
              </h4>
              <p style={{ margin: "5px 0 0 0", color: "#666" }}>Score de passage: {testData.passingScore}%</p>
            </div>
            <button
              className="btn btn-success btn-lg"
              onClick={handleSubmit}
              disabled={loading || testData.questions.length === 0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "15px 30px",
                fontSize: "18px",
              }}
            >
              {loading ? (
                "Enregistrement..."
              ) : (
                <>
                  <Save size={20} />
                  {isEditing ? "Modifier le Test" : "Créer le Test"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateTest
