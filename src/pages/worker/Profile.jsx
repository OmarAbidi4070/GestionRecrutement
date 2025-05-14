"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "../../components/Sidebar"
import { useAuth } from "../../contexts/AuthContext"

function Profile() {
  const { currentUser } = useAuth()
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    birthDate: "",
    education: "",
    skills: "",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get("/api/worker/profile")

        // Si la réponse contient des données de profil, les utiliser
        if (response.data) {
          setProfileData(response.data)
        } else {
          // Sinon, utiliser les données de base de l'utilisateur
          setProfileData({
            ...profileData,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
          })
        }

        setLoading(false)
      } catch (err) {
        // En cas d'erreur, utiliser les données de base de l'utilisateur
        setProfileData({
          ...profileData,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
        })
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchProfileData()
    }
  }, [currentUser])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfileData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError("")

      await axios.post("/api/worker/profile", profileData)

      setSuccess("Profil mis à jour avec succès")

      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la mise à jour du profil")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !currentUser) {
    return <div className="loading">Chargement...</div>
  }

  return (
    <div className="dashboard">
      <Sidebar role="worker" />

      <div className="main-content">
        <h1>Mon Profil</h1>
        <p>Complétez votre profil pour améliorer vos chances d'être sélectionné</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="form-group">
                <label htmlFor="firstName">Prénom</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="form-control"
                  value={profileData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Nom</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="form-control"
                  value={profileData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={profileData.email}
                onChange={handleChange}
                required
                readOnly
              />
              <small className="text-muted">L'email ne peut pas être modifié</small>
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="form-group">
                <label htmlFor="phone">Téléphone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-control"
                  value={profileData.phone || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="birthDate">Date de naissance</label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  className="form-control"
                  value={profileData.birthDate || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Adresse</label>
              <input
                type="text"
                id="address"
                name="address"
                className="form-control"
                value={profileData.address || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="form-group">
                <label htmlFor="city">Ville</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  className="form-control"
                  value={profileData.city || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Pays</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  className="form-control"
                  value={profileData.country || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="education">Formation</label>
              <textarea
                id="education"
                name="education"
                className="form-control"
                value={profileData.education || ""}
                onChange={handleChange}
                rows="3"
                placeholder="Décrivez votre parcours éducatif (diplômes, établissements, années)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="skills">Compétences</label>
              <textarea
                id="skills"
                name="skills"
                className="form-control"
                value={profileData.skills || ""}
                onChange={handleChange}
                rows="3"
                placeholder="Listez vos compétences professionnelles"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile
