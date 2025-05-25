"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function TestResults() {
  const [testResults, setTestResults] = useState([])
  const [selectedResult, setSelectedResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchTestResults = async () => {
      try {
        const response = await axios.get("/api/admin/test-results")
        setTestResults(response.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des résultats de tests")
        setLoading(false)
        console.error(err)
      }
    }

    fetchTestResults()
  }, [])

  const handleViewResult = (result) => {
    setSelectedResult(result)
  }

  const handleCloseDetails = () => {
    setSelectedResult(null)
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
        <h1>Résultats des tests</h1>
        <p>Consultez les résultats des tests de niveau passés par les candidats</p>

        {error && <div className="alert alert-danger">{error}</div>}

        {selectedResult ? (
          <div className="test-result-details">
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}
            >
              <h2>Détails du résultat</h2>
              <button className="btn btn-secondary" onClick={handleCloseDetails}>
                Retour à la liste
              </button>
            </div>

            <div className="card" style={{ marginBottom: "20px" }}>
              <h3>Informations générales</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <p>
                    <strong>Candidat:</strong> {selectedResult.userId.firstName} {selectedResult.userId.lastName}
                  </p>
                  <p>
                    <strong>Test:</strong> {selectedResult.testId.title}
                  </p>
                  <p>
                    <strong>Score:</strong> {selectedResult.score}%
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Date de début:</strong> {new Date(selectedResult.startedAt).toLocaleString()}
                  </p>
                  <p>
                    <strong>Date de fin:</strong> {new Date(selectedResult.completedAt).toLocaleString()}
                  </p>
                  <p>
                    <strong>Statut:</strong>{" "}
                    {selectedResult.score >= selectedResult.testId.passingScore ? (
                      <span className="text-success">Réussi</span>
                    ) : (
                      <span className="text-danger">Échoué</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Réponses</h3>

              {selectedResult.answers && selectedResult.answers.length > 0 ? (
                <div>
                  {selectedResult.answers.map((answer, index) => {
                    const question = selectedResult.testId.questions.find((q) => q._id === answer.questionId)
                    const selectedOption = question?.options.find((o) => o._id === answer.selectedOption)
                    const correctOption = question?.options.find((o) => o.isCorrect)
                    const isCorrect = selectedOption?.isCorrect

                    return (
                      <div
                        key={index}
                        className="answer-item"
                        style={{
                          marginBottom: "20px",
                          padding: "15px",
                          borderRadius: "8px",
                          backgroundColor: isCorrect ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)",
                        }}
                      >
                        <p>
                          <strong>Question {index + 1}:</strong> {question?.text}
                        </p>
                        <p>
                          <strong>Réponse du candidat:</strong> {selectedOption?.text}{" "}
                          {isCorrect ? (
                            <span className="badge badge-success">Correcte</span>
                          ) : (
                            <span className="badge badge-danger">Incorrecte</span>
                          )}
                        </p>
                        {!isCorrect && (
                          <p>
                            <strong>Réponse correcte:</strong> {correctOption?.text}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p>Aucune réponse disponible.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <h3>Liste des résultats</h3>

            {testResults.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Candidat</th>
                      <th>Test</th>
                      <th>Score</th>
                      <th>Date</th>
                      <th>Statut</th>
               
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map((result) => (
                      <tr key={result._id}>
                        <td>
                          {result.userId.firstName} {result.userId.lastName}
                        </td>
                        <td>{result.testId.title}</td>
                        <td>{result.score}%</td>
                        <td>{new Date(result.completedAt).toLocaleDateString()}</td>
                        <td>
                          {result.score >= result.testId.passingScore ? (
                            <span className="badge badge-success">Réussi</span>
                          ) : (
                            <span className="badge badge-danger">Échoué</span>
                          )}
                        </td>
                       
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Aucun résultat de test disponible.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TestResults
