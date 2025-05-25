"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import MessageBox from "../../components/MessageBox"
import { useAuth } from "../../contexts/AuthContext"

function Messages() {
  const { currentUser } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [allUsers, setAllUsers] = useState([])
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Fonction pour obtenir le token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get("/api/messages/conversations", {
          headers: getAuthHeaders(),
        })
        setConversations(response.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des conversations")
        setLoading(false)
        console.error(err)
      }
    }

    fetchConversations()
  }, [])

  // Fonction pour récupérer les utilisateurs disponibles selon le rôle
  const fetchAvailableUsers = async () => {
    setLoadingUsers(true)
    try {
      // Utiliser la route corrigée pour la messagerie
      const response = await axios.get("/api/messaging/users", {
        headers: getAuthHeaders(),
      })
      setAllUsers(response.data)
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs:", err)
      setError("Erreur lors du chargement des utilisateurs disponibles")
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSelectConversation = (user) => {
    setSelectedUser(user)
    setShowNewConversation(false)
  }

  const handleNewConversation = () => {
    setShowNewConversation(true)
    fetchAvailableUsers()
  }

  const handleSelectNewUser = (user) => {
    setSelectedUser(user)
    setShowNewConversation(false)
    // Rafraîchir les conversations après avoir sélectionné un nouvel utilisateur
    setTimeout(() => {
      const fetchConversations = async () => {
        try {
          const response = await axios.get("/api/messages/conversations", {
            headers: getAuthHeaders(),
          })
          setConversations(response.data)
        } catch (err) {
          console.error("Erreur lors du rafraîchissement:", err)
        }
      }
      fetchConversations()
    }, 1000)
  }

  const getUserRole = () => {
    return currentUser?.role || "worker"
  }

  const getRoleDisplayName = (role) => {
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

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "badge-danger"
      case "responsable":
        return "badge-warning"
      case "worker":
        return "badge-info"
      default:
        return "badge-secondary"
    }
  }

  return (
    <div className="dashboard">
      <Sidebar role={getUserRole()} />

      <div className="main-content">
        <h1>Messagerie</h1>
        <p>Communiquez avec les autres utilisateurs de la plateforme</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <div
          className="messaging-container"
          style={{
            display: "grid",
            gridTemplateColumns: "350px 1fr",
            gap: "20px",
            height: "calc(100vh - 150px)",
            marginTop: "20px",
          }}
        >
          <div className="conversations-list card" style={{ overflowY: "auto" }}>
            <div style={{ padding: "15px", borderBottom: "1px solid #ddd" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>Conversations</h3>
                <button className="btn btn-sm btn-primary" onClick={handleNewConversation}>
                  + Nouveau
                </button>
              </div>
            </div>

            {loading ? (
              <p style={{ padding: "15px" }}>Chargement des conversations...</p>
            ) : showNewConversation ? (
              <div style={{ padding: "15px" }}>
                <div style={{ marginBottom: "15px" }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowNewConversation(false)}>
                    ← Retour
                  </button>
                </div>
                <h4>Nouvelle conversation</h4>
                <p className="text-muted">Sélectionnez un utilisateur pour commencer une conversation</p>
                {loadingUsers ? (
                  <p>Chargement des utilisateurs...</p>
                ) : allUsers.length > 0 ? (
                  <ul className="list-group">
                    {allUsers.map((user) => (
                      <li
                        key={user._id}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleSelectNewUser(user)}
                        style={{ cursor: "pointer" }}
                      >
                        <div>
                          <strong>
                            {user.firstName} {user.lastName}
                          </strong>
                          <span
                            className={`badge ${getRoleBadgeClass(user.role)}`}
                            style={{ marginLeft: "10px", fontSize: "0.7rem" }}
                          >
                            {getRoleDisplayName(user.role)}
                          </span>
                        </div>
                        <small className="text-muted">{user.email}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">Aucun utilisateur disponible pour une conversation</p>
                )}
              </div>
            ) : conversations.length > 0 ? (
              <ul className="list-group list-group-flush">
                {conversations.map((conversation) => (
                  <li
                    key={conversation.user._id}
                    className={`list-group-item list-group-item-action ${
                      selectedUser && selectedUser._id === conversation.user._id ? "active" : ""
                    }`}
                    onClick={() => handleSelectConversation(conversation.user)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="conversation-item">
                      <div className="conversation-name" style={{ fontWeight: "bold" }}>
                        {conversation.user.firstName} {conversation.user.lastName}
                        <span
                          className={`badge ${getRoleBadgeClass(conversation.user.role)}`}
                          style={{ marginLeft: "10px", fontSize: "0.7rem" }}
                        >
                          {getRoleDisplayName(conversation.user.role)}
                        </span>
                      </div>
                      {conversation.lastMessage && (
                        <div className="conversation-preview" style={{ color: "#666", fontSize: "0.9rem" }}>
                          {conversation.lastMessage.content.substring(0, 40)}
                          {conversation.lastMessage.content.length > 40 ? "..." : ""}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "5px",
                        }}
                      >
                        <small className="text-muted">
                          {conversation.lastMessage &&
                            new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                        </small>
                        {conversation.unreadCount > 0 && (
                          <span className="badge badge-danger">{conversation.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ padding: "15px", textAlign: "center" }}>
                <p>Aucune conversation</p>
                <button className="btn btn-primary" onClick={handleNewConversation}>
                  Démarrer une conversation
                </button>
              </div>
            )}
          </div>

          <div className="message-container card">
            {selectedUser ? (
              <MessageBox
                recipientId={selectedUser._id}
                recipientName={`${selectedUser.firstName} ${selectedUser.lastName}`}
                recipientRole={selectedUser.role}
              />
            ) : (
              <div
                className="no-conversation-selected"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#666",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <h5>💬 Messagerie</h5>
                  <p>Sélectionnez une conversation ou démarrez-en une nouvelle</p>
                  <button className="btn btn-outline-primary" onClick={handleNewConversation}>
                    Nouvelle conversation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messages
