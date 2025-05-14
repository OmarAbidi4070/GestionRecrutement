"use client"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"

// Pages
import Login from "./pages/Login"
import Register from "./pages/Register"
import AdminDashboard from "./pages/admin/Dashboard"
import ResponsableDashboard from "./pages/responsable/Dashboard"
import WorkerDashboard from "./pages/worker/Dashboard"
import NotFound from "./pages/NotFound"

// Pages Worker
import WorkerProfile from "./pages/worker/Profile"
import WorkerDocuments from "./pages/worker/Documents"
import WorkerTests from "./pages/worker/Tests"
import WorkerTrainings from "./pages/worker/Trainings"
import WorkerComplaints from "./pages/worker/Complaints"
import WorkerMessages from "./pages/worker/Messages"

// Pages Responsable
import ResponsableTests from "./pages/responsable/Tests"
import ResponsableCandidates from "./pages/responsable/Candidates"
import ResponsableTrainings from "./pages/responsable/Trainings"
import ResponsableMessages from "./pages/responsable/Messages"
import CreateTest from "./pages/responsable/CreateTest"

// Pages Admin
import AdminUsers from "./pages/admin/Users"
import AdminJobs from "./pages/admin/Jobs"
import AdminComplaints from "./pages/admin/Complaints"
import AdminTestResults from "./pages/admin/TestResults"
import AdminStatistics from "./pages/admin/Statistics"
import AdminMessages from "./pages/admin/Messages"

// CSS
import "./App.css"

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <div className="loading">Chargement...</div>
  }

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (!allowedRoles.includes(currentUser.role)) {
    // Rediriger vers le tableau de bord approprié en fonction du rôle
    if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" />
    } else if (currentUser.role === "responsable") {
      return <Navigate to="/responsable/dashboard" />
    } else {
      return <Navigate to="/worker/dashboard" />
    }
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminComplaints />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/test-results"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminTestResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/statistics"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminStatistics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminMessages />
                </ProtectedRoute>
              }
            />

            {/* Responsable Routes */}
            <Route
              path="/responsable/dashboard"
              element={
                <ProtectedRoute allowedRoles={["responsable"]}>
                  <ResponsableDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/responsable/candidates"
              element={
                <ProtectedRoute allowedRoles={["responsable"]}>
                  <ResponsableCandidates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/responsable/tests"
              element={
                <ProtectedRoute allowedRoles={["responsable"]}>
                  <ResponsableTests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/responsable/create-test"
              element={
                <ProtectedRoute allowedRoles={["responsable"]}>
                  <CreateTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/responsable/trainings"
              element={
                <ProtectedRoute allowedRoles={["responsable"]}>
                  <ResponsableTrainings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/responsable/messages"
              element={
                <ProtectedRoute allowedRoles={["responsable"]}>
                  <ResponsableMessages />
                </ProtectedRoute>
              }
            />

            {/* Worker Routes */}
            <Route
              path="/worker/dashboard"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <WorkerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/profile"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <WorkerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/documents"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <WorkerDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/tests"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <WorkerTests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/trainings"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <WorkerTrainings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/complaints"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <WorkerComplaints />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/messages"
              element={
                <ProtectedRoute allowedRoles={["worker"]}>
                  <WorkerMessages />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
