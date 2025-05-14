import { Link } from "react-router-dom"

function NotFound() {
  return (
    <div
      className="not-found-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "6rem", marginBottom: "1rem" }}>404</h1>
      <h2>Page non trouvée</h2>
      <p style={{ marginBottom: "2rem" }}>La page que vous recherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className="btn btn-primary">
        Retour à l'accueil
      </Link>
    </div>
  )
}

export default NotFound
