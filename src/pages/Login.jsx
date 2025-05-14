"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "./Login.css"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      return setError("Veuillez remplir tous les champs")
    }

    try {
      setError("")
      setLoading(true)
      const user = await login(email, password)

      // Redirect based on user role
      if (user.role === "admin") {
        navigate("/admin/dashboard")
      } else if (user.role === "responsable") {
        navigate("/responsable/dashboard")
      } else if (user.role === "worker") {
        navigate("/worker/dashboard")
      }
    } catch (err) {
      setError("Email ou mot de passe incorrect")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Connexion</h2>
          <p>Connectez-vous à votre compte</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Vous n'avez pas de compte? <Link to="/register">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
