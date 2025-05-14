"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import TestQuestion from "../../components/TestQuestion"

function Tests() {
  const [testAssignment, setTestAssignment] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [testStarted, setTestStarted] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAssignedTest = async () => {
      try {
        const response = await axios.get("/api/worker/assigned-test")
        setTestAssignment(response.data)
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

  const handleStartTest = async () => {
    try {
      await axios.post(`/api/worker/start-test/${testAssignment._id}`)
      setTestStarted(true)
    } catch (err) {
      setError("Erreur lors du démarrage du test")
      console.error(err)
    }
  }

  const handleAnswer = async (questionId, selectedOption) => {
    try {
      await axios.post("/api/worker/submit-answer", {
        assignmentId: testAssignment._id,
        questionId,
        selectedOption,
      })

      // Update local state
      setAnswers({
        ...answers,
        [questionId]: selectedOption,
      })

      // Move to next question if not the last one
      if (currentQuestionIndex < testAssignment.testId.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }
    } catch (err) {
      setError("Erreur lors de l'enregistrement de la réponse")
      console.error(err)
    }
  }

  const handleCompleteTest = async () => {
    try {
      const response = await axios.post(`/api/worker/complete-test/${testAssignment._id}`)
      setTestCompleted(true)
      setTestResult(response.data)
    } catch (err) {
      setError("Erreur lors de la soumission du test")
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar role="worker" />
        <div className="main-content">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Sidebar role="worker" />

      <div className="main-content">
        <h1>Tests de niveau</h1>

        {error && <div className="alert alert-danger">{error}</div>}

        {!testAssignment ? (
          <div className="card">
            <h3>Aucun test assigné</h3>
            <p>Vous n'avez pas de test de niveau assigné pour le moment.</p>
          </div>
        ) : testCompleted ? (
          <div className="card">
            <h3>Test terminé</h3>
            <div className="test-result">
              <p>
                Votre score: <strong>{testResult.score}%</strong>
              </p>
              <p>
                {testResult.score >= 50 ? (
                  <span className="text-success">Félicitations! Vous avez réussi le test.</span>
                ) : (
                  <span className="text-danger">Vous n'avez pas obtenu la note minimale requise.</span>
                )}
              </p>
              <p>
                {testResult.score >= 50
                  ? "Un administrateur va examiner votre dossier pour vous affecter à un poste."
                  : "Un responsable va vous affecter à une formation pour améliorer vos compétences."}
              </p>
            </div>
          </div>
        ) : !testStarted ? (
          <div className="card">
            <h3>{testAssignment.testId.title}</h3>
            <p>{testAssignment.testId.description}</p>
            <div className="test-info">
              <p>
                <strong>Nombre de questions:</strong> {testAssignment.testId.questions.length}
              </p>
              <p>
                <strong>Note de passage:</strong> {testAssignment.testId.passingScore}%
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleStartTest}>
              Commencer le test
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="test-progress">
              Question {currentQuestionIndex + 1} sur {testAssignment.testId.questions.length}
            </div>

            <TestQuestion question={testAssignment.testId.questions[currentQuestionIndex]} onAnswer={handleAnswer} />

            <div
              className="test-navigation"
              style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Question précédente
              </button>

              {currentQuestionIndex < testAssignment.testId.questions.length - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  disabled={!answers[testAssignment.testId.questions[currentQuestionIndex]._id]}
                >
                  Question suivante
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={handleCompleteTest}
                  disabled={Object.keys(answers).length < testAssignment.testId.questions.length}
                >
                  Terminer le test
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tests
