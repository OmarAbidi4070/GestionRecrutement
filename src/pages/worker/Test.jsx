"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import { Clock, FileText, CheckCircle, AlertTriangle, Play, ArrowLeft, ArrowRight } from "lucide-react"

function Tests() {
  const [testAssignment, setTestAssignment] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [testStarted, setTestStarted] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(0)

  // Fonction pour obtenir les headers d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  useEffect(() => {
    const fetchAssignedTest = async () => {
      try {
        const response = await axios.get("/api/worker/assigned-test", {
          headers: getAuthHeaders(),
        })
        setTestAssignment(response.data)

        if (response.data.status === "started") {
          setTestStarted(true)
          // Calculer le temps restant
          const startTime = new Date(response.data.startedAt)
          const timeLimit = response.data.testId.timeLimit * 60 * 1000 // en millisecondes
          const elapsed = Date.now() - startTime.getTime()
          const remaining = Math.max(0, timeLimit - elapsed)
          setTimeRemaining(Math.floor(remaining / 1000))
        }

        setLoading(false)
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setLoading(false)
        } else {
          setError("Erreur lors du chargement du test")
          setLoading(false)
          console.error(err)
        }
      }
    }

    fetchAssignedTest()
  }, [])

  // Timer pour le test
  useEffect(() => {
    if (testStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleCompleteTest() // Auto-submit quand le temps est écoulé
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [testStarted, timeRemaining])

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleStartTest = async () => {
    try {
      await axios.post(
        `/api/worker/start-test/${testAssignment._id}`,
        {},
        {
          headers: getAuthHeaders(),
        },
      )
      setTestStarted(true)
      setTimeRemaining(testAssignment.testId.timeLimit * 60)
    } catch (err) {
      setError("Erreur lors du démarrage du test")
      console.error(err)
    }
  }

  const handleAnswer = async (questionId, selectedOption) => {
    try {
      await axios.post(
        "/api/worker/submit-answer",
        {
          assignmentId: testAssignment._id,
          questionId,
          selectedOption,
        },
        {
          headers: getAuthHeaders(),
        },
      )

      // Update local state
      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [questionId]: selectedOption,
      }))
    } catch (err) {
      setError("Erreur lors de l'enregistrement de la réponse")
      console.error(err)
    }
  }

  const handleCompleteTest = async () => {
    try {
      const response = await axios.post(
        `/api/worker/complete-test/${testAssignment._id}`,
        {
          answers,
        },
        {
          headers: getAuthHeaders(),
        },
      )
      setTestCompleted(true)
      setTestResult(response.data)
    } catch (err) {
      setError("Erreur lors de la soumission du test")
      console.error(err)
    }
  }

  const getCurrentQuestion = () => {
    return testAssignment?.testId?.questions?.[currentQuestionIndex]
  }

  const currentQuestionId = getCurrentQuestion()?._id
  const selectedAnswer = answers[currentQuestionId] || ""

  const isQuestionAnswered = (questionId) => {
    return answers.hasOwnProperty(questionId)
  }

  const getProgressPercentage = () => {
    const totalQuestions = testAssignment?.testId?.questions?.length || 0
    const answeredQuestions = Object.keys(answers).length
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
  }

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar role="worker" />
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
      <Sidebar role="worker" />

      <div className="main-content">
        <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileText size={28} />
          Tests de Niveau
        </h1>

        {error && (
          <div className="alert alert-danger" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={20} />
            {error}
          </div>
        )}

        {!testAssignment ? (
          <div className="card" style={{ padding: "40px", textAlign: "center" }}>
            <FileText size={64} style={{ color: "#6c757d", marginBottom: "20px" }} />
            <h3>Aucun test assigné</h3>
            <p style={{ color: "#666", fontSize: "16px" }}>
              Vous n'avez pas de test de niveau assigné pour le moment.
              <br />
              Contactez votre responsable si vous pensez qu'il y a une erreur.
            </p>
          </div>
        ) : testCompleted ? (
          <div className="card" style={{ padding: "40px" }}>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              {testResult.passed ? (
                <CheckCircle size={64} style={{ color: "#28a745", marginBottom: "20px" }} />
              ) : (
                <AlertTriangle size={64} style={{ color: "#dc3545", marginBottom: "20px" }} />
              )}
              <h2>Test Terminé</h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <h3 style={{ color: "#007bff", margin: "0 0 10px 0" }}>{testResult.score}%</h3>
                <p style={{ margin: 0, color: "#666" }}>Votre Score</p>
              </div>
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <h3 style={{ color: "#28a745", margin: "0 0 10px 0" }}>{testResult.correctAnswers}</h3>
                <p style={{ margin: 0, color: "#666" }}>Bonnes Réponses</p>
              </div>
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <h3 style={{ color: "#6c757d", margin: "0 0 10px 0" }}>{testResult.totalQuestions}</h3>
                <p style={{ margin: 0, color: "#666" }}>Total Questions</p>
              </div>
            </div>

            <div
              style={{
                padding: "20px",
                backgroundColor: testResult.passed ? "#d4edda" : "#f8d7da",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              {testResult.passed ? (
                <div>
                  <h4 style={{ color: "#155724", margin: "0 0 10px 0" }}>
                    🎉 Félicitations ! Vous avez réussi le test.
                  </h4>
                  <p style={{ color: "#155724", margin: 0 }}>
                    Un administrateur va examiner votre dossier pour vous affecter à un poste.
                  </p>
                </div>
              ) : (
                <div>
                  <h4 style={{ color: "#721c24", margin: "0 0 10px 0" }}>
                    Vous n'avez pas obtenu la note minimale requise.
                  </h4>
                  <p style={{ color: "#721c24", margin: 0 }}>
                    Un responsable va vous affecter à une formation pour améliorer vos compétences.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : !testStarted ? (
          <div className="card" style={{ padding: "30px" }}>
            <h2 style={{ marginBottom: "20px" }}>{testAssignment.testId.title}</h2>
            <p style={{ fontSize: "16px", marginBottom: "25px", color: "#666" }}>{testAssignment.testId.description}</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#e7f3ff",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <FileText size={32} style={{ color: "#007bff", marginBottom: "10px" }} />
                <h4 style={{ margin: "0 0 5px 0" }}>{testAssignment.testId.questions.length}</h4>
                <p style={{ margin: 0, color: "#666" }}>Questions</p>
              </div>
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#fff3cd",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <Clock size={32} style={{ color: "#856404", marginBottom: "10px" }} />
                <h4 style={{ margin: "0 0 5px 0" }}>{testAssignment.testId.timeLimit} min</h4>
                <p style={{ margin: 0, color: "#666" }}>Durée</p>
              </div>
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#d1ecf1",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <CheckCircle size={32} style={{ color: "#0c5460", marginBottom: "10px" }} />
                <h4 style={{ margin: "0 0 5px 0" }}>{testAssignment.testId.passingScore}%</h4>
                <p style={{ margin: 0, color: "#666" }}>Score requis</p>
              </div>
            </div>

            <div
              style={{
                padding: "20px",
                backgroundColor: "#fff3cd",
                borderRadius: "8px",
                marginBottom: "25px",
              }}
            >
              <h5 style={{ color: "#856404", margin: "0 0 10px 0" }}>Instructions importantes :</h5>
              <ul style={{ color: "#856404", margin: 0, paddingLeft: "20px" }}>
                <li>Lisez attentivement chaque question avant de répondre</li>
                <li>Vous ne pouvez pas revenir en arrière une fois la réponse validée</li>
                <li>Le test se termine automatiquement à la fin du temps imparti</li>
                <li>Assurez-vous d'avoir une connexion internet stable</li>
              </ul>
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleStartTest}
                style={{
                  padding: "15px 30px",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  margin: "0 auto",
                }}
              >
                <Play size={24} />
                Commencer le Test
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header avec timer et progression */}
            <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{testAssignment.testId.title}</h3>
                  <p style={{ margin: "5px 0 0 0", color: "#666" }}>
                    Question {currentQuestionIndex + 1} sur {testAssignment.testId.questions.length}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: timeRemaining < 300 ? "#dc3545" : "#007bff",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Clock size={24} />
                    {formatTime(timeRemaining)}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Temps restant</div>
                </div>
              </div>

              {/* Barre de progression */}
              <div style={{ marginTop: "15px" }}>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#e9ecef",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${getProgressPercentage()}%`,
                      height: "100%",
                      backgroundColor: "#007bff",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "5px",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  <span>{Object.keys(answers).length} réponses</span>
                  <span>{Math.round(getProgressPercentage())}% complété</span>
                </div>
              </div>
            </div>

            {/* Question actuelle */}
            <div className="card" style={{ padding: "30px", marginBottom: "20px" }}>
              {getCurrentQuestion() && (
                <div>
                  <h3 style={{ marginBottom: "25px", lineHeight: "1.4" }}>{getCurrentQuestion().text}</h3>

                  <div style={{ display: "grid", gap: "15px" }}>
                    {getCurrentQuestion().options.map((option, index) => (
                      <div
                        key={option._id}
                        className={`option ${answers[getCurrentQuestion()._id] === option._id ? "selected" : ""}`}
                        onClick={() => handleAnswer(getCurrentQuestion()._id, option._id)}
                        style={{
                          padding: "15px 20px",
                          border: `2px solid ${answers[getCurrentQuestion()._id] === option._id ? "#007bff" : "#dee2e6"}`,
                          borderRadius: "8px",
                          cursor: "pointer",
                          backgroundColor: answers[getCurrentQuestion()._id] === option._id ? "#e7f3ff" : "#fff",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                        }}
                      >
                        <input
                          type="radio"
                          name={`question-${getCurrentQuestion()._id}`}
                          checked={answers[getCurrentQuestion()._id] === option._id}
                          onChange={() => handleAnswer(getCurrentQuestion()._id, option._id)}
                          style={{ margin: 0 }}
                        />
                        <label
                          style={{
                            cursor: "pointer",
                            margin: 0,
                            fontSize: "16px",
                            flex: 1,
                          }}
                        >
                          {option.text}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <ArrowLeft size={18} />
                  Précédent
                </button>

                <div style={{ display: "flex", gap: "10px" }}>
                  {testAssignment.testId.questions.map((_, index) => (
                    <button
                      key={index}
                      className={`btn btn-sm ${
                        index === currentQuestionIndex
                          ? "btn-primary"
                          : isQuestionAnswered(testAssignment.testId.questions[index]._id)
                            ? "btn-success"
                            : "btn-outline-secondary"
                      }`}
                      onClick={() => setCurrentQuestionIndex(index)}
                      style={{ minWidth: "40px" }}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {currentQuestionIndex < testAssignment.testId.questions.length - 1 ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    Suivant
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={handleCompleteTest}
                    disabled={Object.keys(answers).length < testAssignment.testId.questions.length}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <CheckCircle size={18} />
                    Terminer le Test
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tests
