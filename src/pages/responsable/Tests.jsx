"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Tests() {
  const [tests, setTests] = useState([])
  const [testResults, setTestResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("tests") // "tests" ou "results"

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Récupérer les tests créés par ce responsable
        const testsResponse = await axios.get("/api/responsable/tests")
        setTests(testsResponse.data)

        // Récupérer les résultats des tests
        const resultsResponse = await axios.get("/api/responsable/test-results")
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

  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce test ?")) {
      return
    }

    try {
      await axios.delete(`/api/responsable/tests/${testId}`)

      // Mettre à jour la liste des tests
      setTests(tests.filter((test) => test._id !== testId))

      // Afficher un message de succès temporaire
      setError("")
      const successMessage = document.createElement("div")
      successMessage.className = "alert alert-success"
      successMessage.textContent = "Test supprimé avec succès"
      document.querySelector(".main-content").prepend(successMessage)

      setTimeout(() => {
        successMessage.remove()
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression du test")
      console.error(err)
    }
  }

  const handleAssignTest = async (testId) => {
    try {
      // Récupérer la liste des travailleurs
      const workersResponse = await axios.get("/api/responsable/candidates")
      const workers = workersResponse.data.filter((user) => user.role === "worker")

      // Afficher une boîte de dialogue pour sélectionner un travailleur
      const workerId = prompt(
        `Entrez l'ID du travailleur à qui assigner ce test:\n\n${workers.map((w) => `${w._id}: ${w.firstName} ${w.lastName}`).join("\n")}`,
      )

      if (!workerId) return

      // Assigner le test
      await axios.post("/api/responsable/assign-test", {
        userId: workerId,
        testId,
      })

      // Afficher un message de succès temporaire
      setError("")
      const successMessage = document.createElement("div")
      successMessage.className = "alert alert-success"
      successMessage.textContent = "Test assigné avec succès"
      document.querySelector(".main-content").prepend(successMessage)

      setTimeout(() => {
        successMessage.remove()
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'assignation du test")
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
        <h1>Gestion des Tests</h1>

        {error && <div className="alert alert-danger">{error}</div>}

       

        {activeTab === "tests" ? (
          <>
            <div className="action-bar">
              <a href="/responsable/create-test" className="btn btn-primary">
                Créer un nouveau test
              </a>
            </div>

            {tests.length === 0 ? (
              <div className="card">
                <p>Vous n'avez pas encore créé de tests.</p>
              </div>
            ) : (
              <div className="tests-list">
                {tests.map((test) => (
                  <div key={test._id} className="card">
                    <div className="card-header">
                      <h3>{test.title}</h3>
                      <div className="card-actions">
                      
                        <button className="btn btn-danger" onClick={() => handleDeleteTest(test._id)}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      <p>{test.description}</p>
                      <div className="test-meta">
                        <span>
                          <strong>Questions:</strong> {test.questions.length}
                        </span>
                        <span>
                          <strong>Note de passage:</strong> {test.passingScore}%
                        </span>
                        <span>
                          <strong>Date de création:</strong> {new Date(test.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2>Résultats des tests</h2>

            {testResults.length === 0 ? (
              <div className="card">
                <p>Aucun résultat de test disponible.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Candidat</th>
                      <th>Test</th>
                      <th>Score</th>
                      <th>Statut</th>
                      <th>Date</th>
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
                        <td>
                          {result.passed ? (
                            <span className="badge badge-success">Réussi</span>
                          ) : (
                            <span className="badge badge-danger">Échoué</span>
                          )}
                        </td>
                        <td>{new Date(result.completedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Tests
