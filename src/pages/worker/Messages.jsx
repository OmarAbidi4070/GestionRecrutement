"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import MessageBox from "../../components/MessageBox"

function Messages() {
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get("/api/messages")
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

  const handleSelectConversation = (user) => {
    setSelectedUser(user)
  }

  return (
    <div className="dashboard">
      <Sidebar role="worker" />

      <div className="main-content">
        <h1>Messagerie</h1>

        {error && <div className="alert alert-danger">{error}</div>}

        <div
          className="messaging-container"
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: "20px",
            height: "calc(100vh - 150px)",
            marginTop: "20px",
          }}
        >
          <div className="conversations-list card" style={{ overflowY: "auto" }}>
            <h3>Conversations</h3>

            {loading ? (
              <p>Chargement des conversations...</p>
            ) : conversations.length > 0 ? (
              <ul className="list-group">
                {conversations.map((conversation) => (
                  <li
                    key={conversation.user._id}
                    className={`list-group-item ${selectedUser && selectedUser._id === conversation.user._id ? "active" : ""}`}
                    onClick={() => handleSelectConversation(conversation.user)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="conversation-item">
                      <div className="conversation-name">
                        {conversation.user.firstName} {conversation.user.lastName}
                        <span className="badge">{conversation.user.role}</span>
                      </div>
                      {conversation.lastMessage && (
                        <div className="conversation-preview">
                          {conversation.lastMessage.content.substring(0, 30)}
                          {conversation.lastMessage.content.length > 30 ? "..." : ""}
                        </div>
                      )}
                      {conversation.unreadCount > 0 && <span className="unread-badge">{conversation.unreadCount}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucune conversation</p>
            )}
          </div>

          <div className="message-container card">
            {selectedUser ? (
              <MessageBox
                recipientId={selectedUser._id}
                recipientName={`${selectedUser.firstName} ${selectedUser.lastName}`}
              />
            ) : (
              <div className="no-conversation-selected">
                <p>Sélectionnez une conversation pour commencer à discuter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messages
