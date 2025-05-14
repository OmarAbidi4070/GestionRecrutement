"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/admin/users")
        setUsers(response.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des utilisateurs")
        setLoading(false)
        console.error(err)
      }
    }

    fetchUsers()
  }, [])

  const handleUpdateStatus = async (userId, status) => {
    try {
      await axios.put(`/api/admin/users/${userId}/status`, { status })

      // Mettre à jour la liste des utilisateurs
      setUsers(users.map((user) => (user._id === userId ? { ...user, status } : user)))

      setSuccess(`Statut de l'utilisateur mis à jour avec succès`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la mise à jour du statut")
      console.error(err)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur?")) {
      return
    }

    try {
      await axios.delete(`/api/admin/users/${userId}`)

      // Mettre à jour la liste des utilisateurs
      setUsers(users.filter((user) => user._id !== userId))

      setSuccess("Utilisateur supprimé avec succès")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression de l'utilisateur")
      console.error(err)
    }
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
        <h1>Gestion des utilisateurs</h1>
        <p>Gérez les comptes utilisateurs et leurs accès</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <h3>Liste des utilisateurs</h3>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      {user.firstName} {user.lastName}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge badge-${getRoleBadgeClass(user.role)}`}>{getRoleLabel(user.role)}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${getStatusBadgeClass(user.status)}`}>
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group">
                        {user.status === "pending" && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleUpdateStatus(user._id, "active")}
                          >
                            Activer
                          </button>
                        )}
                        {user.status === "active" && (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleUpdateStatus(user._id, "pending")}
                          >
                            Suspendre
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user._id)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// Fonctions utilitaires
function getRoleLabel(role) {
  switch (role) {
    case "admin":
      return "Administrateur"
    case "responsable":
      return "Responsable"
    case "worker":
      return "Travailleur"
    default:
      return role
  }
}

function getRoleBadgeClass(role) {
  switch (role) {
    case "admin":
      return "primary"
    case "responsable":
      return "info"
    case "worker":
      return "secondary"
    default:
      return "secondary"
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "active":
      return "Actif"
    case "pending":
      return "En attente"
    case "rejected":
      return "Rejeté"
    default:
      return status
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "active":
      return "success"
    case "pending":
      return "warning"
    case "rejected":
      return "danger"
    default:
      return "secondary"
  }
}

export default Users
