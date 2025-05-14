"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Configurer l'URL de base pour Axios
  useEffect(() => {
    // Définir l'URL de base pour toutes les requêtes Axios
    axios.defaults.baseURL = "http://localhost:5000"
  }, [])

  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("token")

        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
          const response = await axios.get("/api/auth/me")
          setCurrentUser(response.data)
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error("Auth check error:", err)
        localStorage.removeItem("token")
        delete axios.defaults.headers.common["Authorization"]
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  // Login function
  const login = async (email, password) => {
    try {
      setError("")
      const response = await axios.post("/api/auth/login", { email, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setCurrentUser(user)
      setIsAuthenticated(true)
      return user
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion")
      throw err
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      setError("")
      const response = await axios.post("/api/auth/register", userData)
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || "Erreur d'inscription")
      throw err
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setCurrentUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
