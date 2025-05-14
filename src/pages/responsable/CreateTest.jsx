"use client"

import { useState } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import "../../pages/responsable/CreateTest.css"

function CreateTest() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    passingScore: 50,
    questions: [
      {
        text: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ],
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const handleQuestionChange = (index, e) => {
    const { name, value } = e.target
    const updatedQuestions = [...formData.questions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [name]: value,
    }

    setFormData((prevState) => ({
      ...prevState,
      questions: updatedQuestions,
    }))
  }

  const handleOptionChange = (questionIndex, optionIndex, e) => {
    const { name, value } = e.target
    const updatedQuestions = [...formData.questions]

    if (name === "isCorrect") {
      // Si on marque cette option comme correcte, démarquer les autres
      updatedQuestions[questionIndex].options.forEach((option, idx) => {
        option.isCorrect = idx === optionIndex
      })
    } else {
      updatedQuestions[questionIndex].options[optionIndex] = {
        ...updatedQuestions[questionIndex].options[optionIndex],
        [name]: value,
      }
    }

    setFormData((prevState) => ({
      ...prevState,
      questions: updatedQuestions,
    }))
  }

  const addQuestion = () => {
    setFormData((prevState) => ({
      ...prevState,
      questions: [
        ...prevState.questions,
        {
          text: "",
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
        },
      ],
    }))
  }

  const removeQuestion = (index) => {
    if (formData.questions.length <= 1) {
      return setError("Le test doit contenir au moins une question")
    }

    const updatedQuestions = [...formData.questions]
    updatedQuestions.splice(index, 1)

    setFormData((prevState) => ({
      ...prevState,
      questions: updatedQuestions,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    let isValid = true
    let validationError = ""

    if (!formData.title.trim()) {
      isValid = false
      validationError = "Le titre du test est requis"
    }

    formData.questions.forEach((question, qIndex) => {
      if (!question.text.trim()) {
        isValid = false
        validationError = `La question ${qIndex + 1} n'a pas de texte`
      }

      const hasCorrectOption = question.options.some((option) => option.isCorrect)
      if (!hasCorrectOption) {
        isValid = false
        validationError = `La question ${qIndex + 1} n'a pas de réponse correcte marquée`
      }

      question.options.forEach((option, oIndex) => {
        if (!option.text.trim()) {
          isValid = false
          validationError = `L'option ${oIndex + 1} de la question ${qIndex + 1} n'a pas de texte`
        }
      })
    })

    if (!isValid) {
      return setError(validationError)
    }

    try {
      setLoading(true)
      setError("")

      await axios.post("/api/responsable/tests", formData)

      setSuccess("Test créé avec succès")
      setFormData({
        title: "",
        description: "",
        passingScore: 50,
        questions: [
          {
            text: "",
            options: [
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
            ],
          },
        ],
      })

      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création du test")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <Sidebar role="responsable" />

      <div className="main-content">
        <h1>Créer un test de niveau</h1>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3>Informations générales</h3>

            <div className="form-group">
              <label htmlFor="title">Titre du test</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-control"
                value={formData.title}
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
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="passingScore">Note de passage (%)</label>
              <input
                type="number"
                id="passingScore"
                name="passingScore"
                className="form-control"
                value={formData.passingScore}
                onChange={handleChange}
                min="1"
                max="100"
                required
              />
            </div>
          </div>

          <h3>Questions</h3>

          {formData.questions.map((question, questionIndex) => (
            <div key={questionIndex} className="card" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4>Question {questionIndex + 1}</h4>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeQuestion(questionIndex)}>
                  Supprimer
                </button>
              </div>

              <div className="form-group">
                <label htmlFor={`question-${questionIndex}`}>Texte de la question</label>
                <input
                  type="text"
                  id={`question-${questionIndex}`}
                  name="text"
                  className="form-control"
                  value={question.text}
                  onChange={(e) => handleQuestionChange(questionIndex, e)}
                  required
                />
              </div>

              <h5>Options</h5>

              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="form-group" style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="radio"
                    id={`correct-${questionIndex}-${optionIndex}`}
                    name="isCorrect"
                    checked={option.isCorrect}
                    onChange={(e) => handleOptionChange(questionIndex, optionIndex, e)}
                    style={{ marginRight: "10px" }}
                  />
                  <label htmlFor={`correct-${questionIndex}-${optionIndex}`} style={{ marginRight: "10px" }}>
                    Correcte
                  </label>
                  <input
                    type="text"
                    name="text"
                    className="form-control"
                    value={option.text}
                    onChange={(e) => handleOptionChange(questionIndex, optionIndex, e)}
                    placeholder={`Option ${optionIndex + 1}`}
                    required
                  />
                </div>
              ))}
            </div>
          ))}

          <div style={{ marginBottom: "20px" }}>
            <button type="button" className="btn btn-secondary" onClick={addQuestion}>
              Ajouter une question
            </button>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Création en cours..." : "Créer le test"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateTest
