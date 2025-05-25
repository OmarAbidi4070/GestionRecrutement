"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"

function MessageBox({ recipientId, recipientName }) {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // Fonction pour obtenir le token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/api/messages/${recipientId}`, {
          headers: getAuthHeaders(),
        })
        setMessages(response.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des messages")
        setLoading(false)
        console.error(err)
      }
    }

    if (recipientId) {
      fetchMessages()

      // Set up polling for new messages
      const interval = setInterval(fetchMessages, 10000) // Poll every 10 seconds

      return () => clearInterval(interval)
    }
  }, [recipientId])

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    setError("")

    try {
      // CORRECTION: Utiliser la bonne route et structure
      const response = await axios.post(
        `/api/messages/${recipientId}`,
        {
          content: newMessage,
        },
        {
          headers: getAuthHeaders(),
        },
      )

      // Créer le nouveau message avec la structure correcte
      const newMessageObj = {
        _id: response.data.data._id || Date.now().toString(),
        content: newMessage,
        senderId: currentUser.id,
        receiverId: recipientId,
        createdAt: new Date().toISOString(),
        read: false,
      }

      // Add the new message to the list
      setMessages([...messages, newMessageObj])
      setNewMessage("")
    } catch (err) {
      setError("Erreur lors de l'envoi du message")
      console.error("Send message error:", err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (loading) {
    return (
      <div className="loading" style={{ padding: "20px", textAlign: "center" }}>
        Chargement des messages...
      </div>
    )
  }

  return (
    <div className="message-box" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="message-header" style={{ padding: "15px", borderBottom: "1px solid #ddd" }}>
        <h3 style={{ margin: 0 }}>Conversation avec {recipientName}</h3>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ margin: "10px" }}>
          {error}
        </div>
      )}

      <div
        className="message-list"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "15px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.length === 0 ? (
          <p className="text-center text-muted">Aucun message. Commencez la conversation!</p>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`message ${message.senderId === currentUser.id ? "sent" : "received"}`}
              style={{
                padding: "10px 15px",
                borderRadius: "15px",
                marginBottom: "10px",
                maxWidth: "70%",
                alignSelf: message.senderId === currentUser.id ? "flex-end" : "flex-start",
                backgroundColor: message.senderId === currentUser.id ? "#007bff" : "#f1f0f0",
                color: message.senderId === currentUser.id ? "white" : "black",
                wordWrap: "break-word",
              }}
            >
              <div className="message-content" style={{ marginBottom: "5px" }}>
                {message.content}
              </div>
              <div
                className="message-time"
                style={{
                  fontSize: "0.75rem",
                  opacity: 0.7,
                  textAlign: "right",
                }}
              >
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        className="message-input"
        style={{
          padding: "15px",
          borderTop: "1px solid #ddd",
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="Tapez votre message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={handleSendMessage} disabled={!newMessage.trim() || sending}>
          {sending ? "Envoi..." : "Envoyer"}
        </button>
      </div>
    </div>
  )
}

export default MessageBox
