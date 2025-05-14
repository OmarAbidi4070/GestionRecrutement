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
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/api/messages/${recipientId}`)
        setMessages(response.data)
        setLoading(false)
      } catch (err) {
        setError("Erreur lors du chargement des messages")
        setLoading(false)
        console.error(err)
      }
    }

    fetchMessages()

    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [recipientId])

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const response = await axios.post("/api/messages/send", {
        recipientId,
        content: newMessage,
      })

      // Add the new message to the list
      setMessages([...messages, response.data])
      setNewMessage("")
    } catch (err) {
      setError("Erreur lors de l'envoi du message")
      console.error(err)
    }
  }

  if (loading) {
    return <div className="loading">Chargement des messages...</div>
  }

  return (
    <div className="message-box">
      <div className="message-header">
        <h3>Conversation avec {recipientName}</h3>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div
        className="message-list"
        style={{
          height: "400px",
          overflowY: "auto",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          marginBottom: "10px",
        }}
      >
        {messages.length === 0 ? (
          <p className="text-center text-muted">Aucun message. Commencez la conversation!</p>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`message ${message.senderId === currentUser._id ? "sent" : "received"}`}
              style={{
                padding: "10px",
                borderRadius: "10px",
                marginBottom: "10px",
                maxWidth: "70%",
                alignSelf: message.senderId === currentUser._id ? "flex-end" : "flex-start",
                backgroundColor: message.senderId === currentUser._id ? "#dcf8c6" : "#f1f0f0",
                marginLeft: message.senderId === currentUser._id ? "auto" : "0",
              }}
            >
              <div className="message-content">{message.content}</div>
              <div className="message-time" style={{ fontSize: "0.8rem", color: "#888", textAlign: "right" }}>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input" style={{ display: "flex" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Tapez votre message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button className="btn btn-primary" onClick={handleSendMessage} style={{ marginLeft: "10px" }}>
          Envoyer
        </button>
      </div>
    </div>
  )
}

export default MessageBox
