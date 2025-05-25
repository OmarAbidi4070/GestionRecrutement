const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Initialisation de l'application Express
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Configuration de MongoDB
mongoose
  .connect("mongodb://localhost:27017/recruitment_app", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connecté à MongoDB"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err))

// Schémas et modèles
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "responsable", "worker"], required: true },
  status: { type: String, enum: ["pending", "active", "rejected"], default: "pending" },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  country: { type: String },
  birthDate: { type: Date },
  education: { type: String },
  skills: { type: String },
  createdAt: { type: Date, default: Date.now },
})

const DocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  uploadedAt: { type: Date, default: Date.now },
})

const TestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  passingScore: { type: Number, required: true },
  questions: [
    {
      text: { type: String, required: true },
      options: [
        {
          text: { type: String, required: true },
          isCorrect: { type: Boolean, required: true },
        },
      ],
    },
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
})

const TestResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  score: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  answers: [
    {
      questionId: { type: String, required: true },
      selectedOption: { type: String, required: true },
      isCorrect: { type: Boolean, required: true },
    },
  ],
  completedAt: { type: Date },
  startedAt: { type: Date },
  status: { type: String, default: "assigned" }, // assigned, started, completed
})

const TrainingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String, required: true },
  duration: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
})

const TrainingAttachmentSchema = new mongoose.Schema({
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: "Training", required: true },
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
})

const TrainingAttachment = mongoose.model("TrainingAttachment", TrainingAttachmentSchema)

const TrainingProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: "Training", required: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
})

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String },
  location: { type: String },
  salary: { type: String },
  status: { type: String, enum: ["open", "closed"], default: "open" },
  createdAt: { type: Date, default: Date.now },
})

const JobApplicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coverLetter: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected", "assigned"], default: "pending" },
  appliedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
})

const JobApplication = mongoose.model("JobApplication", JobApplicationSchema)

const ComplaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ["pending", "in-progress", "resolved"], default: "pending" },
  response: { type: String },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
})

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

// Création des modèles
const User = mongoose.model("User", UserSchema)
const Document = mongoose.model("Document", DocumentSchema)
const Test = mongoose.model("Test", TestSchema)
const TestResult = mongoose.model("TestResult", TestResultSchema)
const Training = mongoose.model("Training", TrainingSchema)
const TrainingProgress = mongoose.model("TrainingProgress", TrainingProgressSchema)
const Job = mongoose.model("Job", JobSchema)
const Complaint = mongoose.model("Complaint", ComplaintSchema)
const Message = mongoose.model("Message", MessageSchema)

// Configuration de Multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads"
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Type de fichier non supporté"), false)
    }
  },
})

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) return res.status(401).json({ message: "Accès refusé" })

  jwt.verify(token, "SECRET_KEY", (err, user) => {
    if (err) return res.status(403).json({ message: "Token invalide" })
    req.user = user
    next()
  })
}

// Middleware d'autorisation
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès non autorisé" })
    }
    next()
  }
}

// Création d'un compte admin par défaut
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: "admin@gmail.com" })

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10)

      const admin = new User({
        firstName: "Admin",
        lastName: "System",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin",
        status: "active",
      })

      await admin.save()
      console.log("Compte admin par défaut créé")
    }
  } catch (error) {
    console.error("Erreur lors de la création du compte admin:", error)
  }
}

createDefaultAdmin()

// ==================== ROUTES D'AUTHENTIFICATION ====================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      status: role === "worker" ? "active" : "pending",
    })

    await user.save()
    res.status(201).json({ message: "Utilisateur enregistré avec succès" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" })
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Votre compte est en attente d'approbation ou a été rejeté" })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" })
    }

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, "SECRET_KEY", { expiresIn: "24h" })

    res.status(200).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }
    res.status(200).json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// ==================== ROUTES POUR LES WORKERS ====================

app.get("/api/worker/profile", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }
    res.status(200).json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour mettre à jour le profil (POST et PUT)
app
  .route("/api/worker/profile")
  .post(authenticateToken, authorize(["worker"]), async (req, res) => {
    try {
      const updateData = req.body

      const user = await User.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" })
      }

      Object.keys(updateData).forEach((key) => {
        if (key !== "email" && updateData[key] !== undefined) {
          user[key] = updateData[key]
        }
      })

      await user.save()

      res.status(200).json({
        message: "Profil mis à jour avec succès",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  })
  .put(authenticateToken, authorize(["worker"]), async (req, res) => {
    try {
      const updateData = req.body

      const user = await User.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" })
      }

      Object.keys(updateData).forEach((key) => {
        if (key !== "email" && updateData[key] !== undefined) {
          user[key] = updateData[key]
        }
      })

      await user.save()

      res.status(200).json({
        message: "Profil mis à jour avec succès",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  })

// Route pour l'upload de documents
app.post("/api/worker/upload-document", authenticateToken, authorize(["worker"]), (req, res) => {
  upload.single("document")(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err)
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Le fichier est trop volumineux (max 5MB)" })
      }
      return res.status(400).json({ message: err.message || "Erreur lors du téléchargement" })
    }

    try {
      const { type } = req.body

      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier téléchargé" })
      }

      const document = new Document({
        userId: req.user.id,
        title: type || "Document",
        filePath: req.file.path,
        fileType: req.file.mimetype,
        status: "pending",
      })

      await document.save()

      res.status(201).json({
        message: "Document téléchargé avec succès",
        document: {
          _id: document._id,
          type: document.title,
          filename: req.file.originalname,
          status: document.status,
          createdAt: document.uploadedAt,
        },
      })
    } catch (error) {
      console.error("Database error:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  })
})

app.get("/api/worker/documents", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
    res.status(200).json(documents)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour le statut du profil du worker
app.get("/api/worker/profile-status", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const userId = req.user.id

    const documents = await Document.find({ userId })
    const documentsSubmitted = documents.length > 0
    const documentsVerified = documents.length > 0 && documents.every((doc) => doc.status === "approved")

    const testAssignment = await TestResult.findOne({
      userId,
      status: { $in: ["assigned", "started"] },
    })
    const testAssigned = !!testAssignment

    const completedTest = await TestResult.findOne({ userId, status: "completed" })
    const testCompleted = !!completedTest
    const testPassed = completedTest ? completedTest.passed : false

    const trainingProgress = await TrainingProgress.findOne({ userId })
    const trainingAssigned = !!trainingProgress

    const jobAssigned = false

    const profileStatus = {
      documentsSubmitted,
      documentsVerified,
      testAssigned,
      testCompleted,
      testPassed,
      trainingAssigned,
      jobAssigned,
    }

    res.status(200).json(profileStatus)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour les notifications du worker
app.get("/api/worker/notifications", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const userId = req.user.id
    const notifications = []

    const documents = await Document.find({ userId })
    const testResults = await TestResult.find({ userId, status: "completed" })

    documents.forEach((doc) => {
      if (doc.status === "approved") {
        notifications.push({
          message: `Votre document "${doc.title}" a été approuvé`,
          date: doc.uploadedAt,
          type: "success",
        })
      } else if (doc.status === "rejected") {
        notifications.push({
          message: `Votre document "${doc.title}" a été rejeté`,
          date: doc.uploadedAt,
          type: "error",
        })
      }
    })

    testResults.forEach((result) => {
      if (result.passed) {
        notifications.push({
          message: `Félicitations ! Vous avez réussi votre test avec un score de ${result.score}%`,
          date: result.completedAt,
          type: "success",
        })
      } else {
        notifications.push({
          message: `Vous n'avez pas atteint le score minimum au test (${result.score}%). Une formation vous sera assignée.`,
          date: result.completedAt,
          type: "warning",
        })
      }
    })

    notifications.sort((a, b) => new Date(b.date) - new Date(a.date))
    const recentNotifications = notifications.slice(0, 10)

    res.status(200).json(recentNotifications)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour récupérer un test assigné - CORRECTION DE L'ERREUR 404
app.get("/api/worker/assigned-test", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const testAssignment = await TestResult.findOne({
      userId: req.user.id,
      status: { $in: ["assigned", "started"] },
    }).populate({
      path: "testId",
      select: "title description questions passingScore",
    })

    if (!testAssignment) {
      return res.status(404).json({ message: "Aucun test assigné" })
    }

    const formattedTest = {
      _id: testAssignment._id,
      testId: {
        _id: testAssignment.testId._id,
        title: testAssignment.testId.title,
        description: testAssignment.testId.description,
        passingScore: testAssignment.testId.passingScore,
        questions: testAssignment.testId.questions.map((q) => ({
          _id: q._id,
          text: q.text,
          options: q.options.map((o) => ({
            _id: o._id,
            text: o.text,
          })),
        })),
      },
    }

    res.json(formattedTest)
  } catch (error) {
    console.error("Get assigned test error:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Routes pour gérer les tests
app.post("/api/worker/start-test/:id", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const testAssignment = await TestResult.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })

    if (!testAssignment) {
      return res.status(404).json({ message: "Test non trouvé" })
    }

    testAssignment.startedAt = new Date()
    testAssignment.status = "started"
    await testAssignment.save()

    res.json({ message: "Test démarré avec succès" })
  } catch (error) {
    console.error("Start test error:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.post("/api/worker/submit-answer", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const { assignmentId, questionId, selectedOption } = req.body

    const testAssignment = await TestResult.findOne({
      _id: assignmentId,
      userId: req.user.id,
    })

    if (!testAssignment) {
      return res.status(404).json({ message: "Test non trouvé" })
    }

    const test = await Test.findById(testAssignment.testId)
    const question = test.questions.id(questionId)

    if (!question) {
      return res.status(404).json({ message: "Question non trouvée" })
    }

    const option = question.options.id(selectedOption)
    if (!option) {
      return res.status(404).json({ message: "Option non trouvée" })
    }

    const answerIndex = testAssignment.answers.findIndex((a) => a.questionId === questionId)

    if (answerIndex !== -1) {
      testAssignment.answers[answerIndex].selectedOption = selectedOption
      testAssignment.answers[answerIndex].isCorrect = option.isCorrect
    } else {
      testAssignment.answers.push({
        questionId,
        selectedOption,
        isCorrect: option.isCorrect,
      })
    }

    await testAssignment.save()
    res.json({ message: "Réponse enregistrée avec succès" })
  } catch (error) {
    console.error("Submit answer error:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.post("/api/worker/complete-test/:id", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const testAssignment = await TestResult.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate("testId")

    if (!testAssignment) {
      return res.status(404).json({ message: "Test non trouvé" })
    }

    const totalQuestions = testAssignment.testId.questions.length
    const correctAnswers = testAssignment.answers.filter((a) => a.isCorrect).length
    const score = Math.round((correctAnswers / totalQuestions) * 100)
    const passed = score >= testAssignment.testId.passingScore

    testAssignment.score = score
    testAssignment.passed = passed
    testAssignment.completedAt = new Date()
    testAssignment.status = "completed"

    await testAssignment.save()

    res.json({
      score,
      passed,
      correctAnswers,
      totalQuestions,
    })
  } catch (error) {
    console.error("Complete test error:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Routes pour les tests disponibles
app.get("/api/worker/tests", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const tests = await Test.find().select("title description passingScore")
    const results = await TestResult.find({ userId: req.user.id })

    const testsWithResults = tests.map((test) => {
      const result = results.find((r) => r.testId.toString() === test._id.toString())
      return {
        id: test._id,
        title: test.title,
        description: test.description,
        passingScore: test.passingScore,
        result: result
          ? {
              score: result.score,
              passed: result.passed,
              completedAt: result.completedAt,
            }
          : null,
      }
    })

    res.status(200).json(testsWithResults)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Routes pour les formations
app.get("/api/worker/trainings", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const progress = await TrainingProgress.find({ userId: req.user.id }).populate("trainingId")

    const trainingsWithProgress = await Promise.all(
      progress.map(async (userProgress) => {
        const attachments = await TrainingAttachment.find({ trainingId: userProgress.trainingId._id })

        return {
          id: userProgress.trainingId._id,
          title: userProgress.trainingId.title,
          description: userProgress.trainingId.description,
          duration: userProgress.trainingId.duration,
          content: userProgress.trainingId.content,
          attachments: attachments,
          progress: {
            percentage: userProgress.progress,
            completed: userProgress.completed,
            startedAt: userProgress.startedAt,
            completedAt: userProgress.completedAt,
          },
        }
      }),
    )

    res.status(200).json(trainingsWithProgress)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/worker/trainings/:id", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const training = await Training.findById(req.params.id)
    if (!training) {
      return res.status(404).json({ message: "Formation non trouvée" })
    }

    let userProgress = await TrainingProgress.findOne({
      userId: req.user.id,
      trainingId: training._id,
    })

    if (!userProgress) {
      userProgress = new TrainingProgress({
        userId: req.user.id,
        trainingId: training._id,
      })
      await userProgress.save()
    }

    const attachments = await TrainingAttachment.find({ trainingId: training._id })

    res.status(200).json({
      id: training._id,
      title: training.title,
      description: training.description,
      content: training.content,
      duration: training.duration,
      attachments: attachments,
      progress: {
        percentage: userProgress.progress,
        completed: userProgress.completed,
        startedAt: userProgress.startedAt,
        completedAt: userProgress.completedAt,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.put("/api/worker/trainings/:id/progress", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const { progress } = req.body

    const training = await Training.findById(req.params.id)
    if (!training) {
      return res.status(404).json({ message: "Formation non trouvée" })
    }

    let userProgress = await TrainingProgress.findOne({
      userId: req.user.id,
      trainingId: training._id,
    })

    if (!userProgress) {
      userProgress = new TrainingProgress({
        userId: req.user.id,
        trainingId: training._id,
      })
    }

    userProgress.progress = progress

    if (progress >= 100) {
      userProgress.completed = true
      userProgress.completedAt = Date.now()
    }

    await userProgress.save()

    res.status(200).json({
      message: "Progrès mis à jour avec succès",
      progress: {
        percentage: userProgress.progress,
        completed: userProgress.completed,
        startedAt: userProgress.startedAt,
        completedAt: userProgress.completedAt,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Routes pour les réclamations
app.post("/api/worker/complaints", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const { subject, description } = req.body

    const complaint = new Complaint({
      userId: req.user.id,
      subject,
      description,
    })

    await complaint.save()

    res.status(201).json({
      message: "Réclamation soumise avec succès",
      complaint: {
        id: complaint._id,
        subject: complaint.subject,
        status: complaint.status,
        createdAt: complaint.createdAt,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/worker/complaints", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.id })
    res.status(200).json(complaints)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// ==================== ROUTES POUR LES RESPONSABLES ====================

app.get("/api/responsable/dashboard", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const pendingUsers = await User.countDocuments({ role: "worker", status: "pending" })
    const pendingDocuments = await Document.countDocuments({ status: "pending" })
    const tests = await Test.countDocuments({ createdBy: req.user.id })

    const recentResults = await TestResult.find()
      .sort({ completedAt: -1 })
      .limit(5)
      .populate("userId", "firstName lastName")
      .populate("testId", "title")

    res.status(200).json({
      pendingUsers,
      pendingDocuments,
      tests,
      recentResults,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/responsable/candidates", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const candidates = await User.find({ role: "worker" }).select("-password")
    res.status(200).json(candidates)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get(
  "/api/responsable/candidates/:id/documents",
  authenticateToken,
  authorize(["responsable"]),
  async (req, res) => {
    try {
      const documents = await Document.find({ userId: req.params.id })
      res.status(200).json(documents)
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },
)

app.put("/api/responsable/documents/:id/verify", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const { status } = req.body

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" })
    }

    const document = await Document.findById(req.params.id)
    if (!document) {
      return res.status(404).json({ message: "Document non trouvé" })
    }

    document.status = status
    await document.save()

    res.status(200).json({
      message: "Statut du document mis à jour avec succès",
      document: {
        id: document._id,
        title: document.title,
        status: document.status,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/responsable/tests", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const tests = await Test.find({ createdBy: req.user.id })
    res.status(200).json(tests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// CORRECTION DE L'ERREUR 404 - Route GET pour un test spécifique
app.get("/api/responsable/tests/:id", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    })

    if (!test) {
      return res.status(404).json({ message: "Test non trouvé" })
    }

    res.status(200).json(test)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.post("/api/responsable/tests", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const { title, description, passingScore, questions } = req.body

    if (!title) {
      return res.status(400).json({ message: "Le titre du test est requis" })
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Le test doit contenir au moins une question" })
    }

    for (const question of questions) {
      if (!question.text) {
        return res.status(400).json({ message: "Chaque question doit avoir un texte" })
      }

      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        return res.status(400).json({ message: "Chaque question doit avoir au moins deux options" })
      }

      const hasCorrectOption = question.options.some((option) => option.isCorrect)
      if (!hasCorrectOption) {
        return res.status(400).json({ message: "Chaque question doit avoir au moins une option correcte" })
      }
    }

    const test = new Test({
      title,
      description,
      passingScore: passingScore || 50,
      questions,
      createdBy: req.user.id,
    })

    await test.save()

    res.status(201).json({
      message: "Test créé avec succès",
      test: {
        id: test._id,
        title: test.title,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// CORRECTION DE L'ERREUR 404 - Route PUT pour modifier un test
app.put("/api/responsable/tests/:id", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const { title, description, passingScore, questions } = req.body

    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    })

    if (!test) {
      return res.status(404).json({ message: "Test non trouvé ou vous n'êtes pas autorisé à le modifier" })
    }

    // Vérifier si le test a déjà été assigné
    const resultsExist = await TestResult.exists({ testId: test._id })
    if (resultsExist) {
      return res.status(400).json({ message: "Ce test ne peut pas être modifié car des utilisateurs l'ont déjà passé" })
    }

    if (!title) {
      return res.status(400).json({ message: "Le titre du test est requis" })
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Le test doit contenir au moins une question" })
    }

    for (const question of questions) {
      if (!question.text) {
        return res.status(400).json({ message: "Chaque question doit avoir un texte" })
      }

      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        return res.status(400).json({ message: "Chaque question doit avoir au moins deux options" })
      }

      const hasCorrectOption = question.options.some((option) => option.isCorrect)
      if (!hasCorrectOption) {
        return res.status(400).json({ message: "Chaque question doit avoir au moins une option correcte" })
      }
    }

    test.title = title
    test.description = description
    test.passingScore = passingScore || 50
    test.questions = questions

    await test.save()

    res.status(200).json({
      message: "Test modifié avec succès",
      test: {
        id: test._id,
        title: test.title,
        description: test.description,
        passingScore: test.passingScore,
        questions: test.questions,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.post("/api/responsable/assign-test", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const { userId, testId } = req.body

    const user = await User.findOne({ _id: userId, role: "worker" })
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé ou n'est pas un travailleur" })
    }

    const test = await Test.findById(testId)
    if (!test) {
      return res.status(404).json({ message: "Test non trouvé" })
    }

    const existingAssignment = await TestResult.findOne({
      userId,
      status: { $in: ["assigned", "started"] },
    })

    if (existingAssignment) {
      return res.status(400).json({ message: "Cet utilisateur a déjà un test assigné" })
    }

    const testResult = new TestResult({
      userId,
      testId,
      score: 0,
      passed: false,
      answers: [],
      status: "assigned",
    })

    await testResult.save()

    res.status(201).json({
      message: "Test assigné avec succès",
      assignment: {
        id: testResult._id,
        userId,
        testId,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/responsable/test-results", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const tests = await Test.find({ createdBy: req.user.id }).select("_id")
    const testIds = tests.map((test) => test._id)

    const results = await TestResult.find({
      testId: { $in: testIds },
      status: "completed",
    })
      .populate("userId", "firstName lastName email")
      .populate("testId", "title passingScore")

    res.status(200).json(results)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.delete("/api/responsable/tests/:id", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    })

    if (!test) {
      return res.status(404).json({ message: "Test non trouvé ou vous n'êtes pas autorisé à le supprimer" })
    }

    const resultsExist = await TestResult.exists({ testId: test._id })
    if (resultsExist) {
      return res
        .status(400)
        .json({ message: "Ce test ne peut pas être supprimé car des utilisateurs l'ont déjà passé" })
    }

    await test.deleteOne()
    res.status(200).json({ message: "Test supprimé avec succès" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Routes pour les formations
app.get("/api/responsable/trainings", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const trainings = await Training.find({ createdBy: req.user.id })
    res.status(200).json(trainings)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.post("/api/responsable/trainings", authenticateToken, authorize(["responsable"]), (req, res) => {
  upload.array("attachments", 10)(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err)
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Un ou plusieurs fichiers sont trop volumineux (max 5MB chacun)" })
      }
      return res.status(400).json({ message: err.message || "Erreur lors du téléchargement" })
    }

    try {
      const { title, description, content, duration } = req.body

      if (!title || !description || !content) {
        return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis" })
      }

      const training = new Training({
        title,
        description,
        content,
        duration: Number.parseInt(duration) || 7,
        createdBy: req.user.id,
      })

      await training.save()

      // Sauvegarder les attachments s'il y en a
      const attachments = []
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const attachment = new TrainingAttachment({
            trainingId: training._id,
            originalName: file.originalname,
            filename: file.filename,
            filePath: file.path,
            fileSize: file.size,
          })
          await attachment.save()
          attachments.push(attachment)
        }
      }

      res.status(201).json({
        message: "Formation créée avec succès",
        training: {
          _id: training._id,
          title: training.title,
          description: training.description,
          content: training.content,
          duration: training.duration,
          createdAt: training.createdAt,
          attachments: attachments,
        },
      })
    } catch (error) {
      console.error("Erreur création formation:", error)
      res.status(500).json({ message: "Erreur serveur lors de la création de la formation" })
    }
  })
})

app.delete("/api/responsable/trainings/:id", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const training = await Training.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    })

    if (!training) {
      return res.status(404).json({ message: "Formation non trouvée ou vous n'êtes pas autorisé à la supprimer" })
    }

    const progressExists = await TrainingProgress.exists({ trainingId: training._id })
    if (progressExists) {
      return res
        .status(400)
        .json({ message: "Cette formation ne peut pas être supprimée car des utilisateurs l'ont déjà commencée" })
    }

    await training.deleteOne()
    res.status(200).json({ message: "Formation supprimée avec succès" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour récupérer les attachments d'une formation
app.get("/api/training/:id/attachments", authenticateToken, async (req, res) => {
  try {
    const attachments = await TrainingAttachment.find({ trainingId: req.params.id })
    res.status(200).json(attachments)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour télécharger un attachment
app.get("/api/training/:trainingId/attachment/:attachmentId", authenticateToken, async (req, res) => {
  try {
    const attachment = await TrainingAttachment.findOne({
      _id: req.params.attachmentId,
      trainingId: req.params.trainingId,
    })

    if (!attachment) {
      return res.status(404).json({ message: "Fichier non trouvé" })
    }

    res.download(attachment.filePath, attachment.originalName)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour que le responsable voie la progression des formations
app.get("/api/responsable/training-progress", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const trainings = await Training.find({ createdBy: req.user.id })
    const trainingIds = trainings.map((t) => t._id)

    const progressData = await TrainingProgress.find({ trainingId: { $in: trainingIds } })
      .populate("userId", "firstName lastName email")
      .populate("trainingId", "title")

    res.status(200).json(progressData)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour assigner une formation
app.post("/api/responsable/assign-training", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const { userId, trainingId } = req.body

    const user = await User.findOne({ _id: userId, role: "worker" })
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé ou n'est pas un travailleur" })
    }

    const training = await Training.findById(trainingId)
    if (!training) {
      return res.status(404).json({ message: "Formation non trouvée" })
    }

    // Vérifier si l'utilisateur a déjà cette formation assignée
    const existingProgress = await TrainingProgress.findOne({ userId, trainingId })
    if (existingProgress) {
      return res.status(400).json({ message: "Cette formation est déjà assignée à cet utilisateur" })
    }

    const trainingProgress = new TrainingProgress({
      userId,
      trainingId,
      progress: 0,
      completed: false,
    })

    await trainingProgress.save()

    res.status(201).json({
      message: "Formation assignée avec succès",
      assignment: {
        id: trainingProgress._id,
        userId,
        trainingId,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// ==================== ROUTES POUR LES ADMINS ====================

app.get("/api/admin/dashboard", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const usersByRole = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])
    const pendingUsers = await User.countDocuments({ status: "pending" })
    const pendingComplaints = await Complaint.countDocuments({ status: "pending" })
    const testResults = await TestResult.aggregate([{ $group: { _id: "$passed", count: { $sum: 1 } } }])

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName email role status createdAt")

    res.status(200).json({
      usersByRole,
      pendingUsers,
      pendingComplaints,
      testResults,
      recentUsers,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/admin/users", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.status(200).json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.put("/api/admin/users/:id/status", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const { status } = req.body

    if (!["pending", "active", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    if (user.email === "admin@gmail.com") {
      return res.status(403).json({ message: "Vous ne pouvez pas modifier le statut de l'administrateur par défaut" })
    }

    user.status = status
    await user.save()

    res.status(200).json({
      message: "Statut de l'utilisateur mis à jour avec succès",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.delete("/api/admin/users/:id", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    if (user.email === "admin@gmail.com") {
      return res.status(403).json({ message: "Vous ne pouvez pas supprimer l'administrateur par défaut" })
    }

    await Document.deleteMany({ userId: user._id })
    await TestResult.deleteMany({ userId: user._id })
    await TrainingProgress.deleteMany({ userId: user._id })
    await Complaint.deleteMany({ userId: user._id })
    await Message.deleteMany({ $or: [{ senderId: user._id }, { receiverId: user._id }] })
    await user.deleteOne()

    res.status(200).json({ message: "Utilisateur et données associées supprimés avec succès" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Routes pour les offres d'emploi
app.get("/api/admin/jobs", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const jobs = await Job.find()
    res.status(200).json(jobs)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.post("/api/admin/jobs", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const { title, description, requirements, location, salary } = req.body

    const job = new Job({
      title,
      description,
      requirements,
      location,
      salary,
    })

    await job.save()

    res.status(201).json({
      message: "Offre d'emploi créée avec succès",
      job: {
        id: job._id,
        title: job.title,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.put("/api/admin/jobs/:id", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const { title, description, requirements, location, salary, status } = req.body

    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ message: "Offre d'emploi non trouvée" })
    }

    job.title = title || job.title
    job.description = description || job.description
    job.requirements = requirements || job.requirements
    job.location = location || job.location
    job.salary = salary || job.salary
    job.status = status || job.status

    await job.save()

    res.status(200).json({
      message: "Offre d'emploi mise à jour avec succès",
      job: {
        id: job._id,
        title: job.title,
        status: job.status,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.delete("/api/admin/jobs/:id", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: "Offre d'emploi non trouvée" })
    }

    await job.deleteOne()
    res.status(200).json({ message: "Offre d'emploi supprimée avec succès" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// ==================== ROUTES POUR LES CANDIDATURES ====================

// Route pour que les workers voient les jobs disponibles
app.get("/api/worker/jobs", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" })

    // Récupérer les candidatures de l'utilisateur
    const userApplications = await JobApplication.find({ userId: req.user.id })

    // Ajouter l'information de candidature à chaque job
    const jobsWithApplicationStatus = jobs.map((job) => {
      const application = userApplications.find((app) => app.jobId.toString() === job._id.toString())
      return {
        ...job.toObject(),
        hasApplied: !!application,
        applicationStatus: application ? application.status : null,
      }
    })

    res.status(200).json(jobsWithApplicationStatus)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour postuler à un job
app.post("/api/worker/jobs/:jobId/apply", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const { coverLetter } = req.body
    const jobId = req.params.jobId

    // Vérifier que le job existe et est ouvert
    const job = await Job.findOne({ _id: jobId, status: "open" })
    if (!job) {
      return res.status(404).json({ message: "Offre d'emploi non trouvée ou fermée" })
    }

    // Vérifier que l'utilisateur n'a pas déjà postulé
    const existingApplication = await JobApplication.findOne({ jobId, userId: req.user.id })
    if (existingApplication) {
      return res.status(400).json({ message: "Vous avez déjà postulé à cette offre" })
    }

    const application = new JobApplication({
      jobId,
      userId: req.user.id,
      coverLetter,
    })

    await application.save()

    res.status(201).json({
      message: "Candidature soumise avec succès",
      application: {
        id: application._id,
        status: application.status,
        appliedAt: application.appliedAt,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour que les workers voient leurs candidatures
app.get("/api/worker/applications", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const applications = await JobApplication.find({ userId: req.user.id })
      .populate("jobId", "title location status")
      .sort({ appliedAt: -1 })

    res.status(200).json(applications)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour que l'admin voie toutes les candidatures
app.get("/api/admin/applications", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const applications = await JobApplication.find()
      .populate("userId", "firstName lastName email")
      .populate("jobId", "title location")
      .populate("reviewedBy", "firstName lastName")
      .sort({ appliedAt: -1 })

    res.status(200).json(applications)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour que l'admin voie les candidatures d'un job spécifique
app.get("/api/admin/jobs/:jobId/applications", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const applications = await JobApplication.find({ jobId: req.params.jobId })
      .populate("userId", "firstName lastName email phone")
      .sort({ appliedAt: -1 })

    res.status(200).json(applications)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour traiter une candidature (accepter/rejeter/assigner)
app.put("/api/admin/applications/:id", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const { status } = req.body

    if (!["pending", "accepted", "rejected", "assigned"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" })
    }

    const application = await JobApplication.findById(req.params.id)
    if (!application) {
      return res.status(404).json({ message: "Candidature non trouvée" })
    }

    application.status = status
    application.reviewedAt = new Date()
    application.reviewedBy = req.user.id

    await application.save()

    res.status(200).json({
      message: "Candidature mise à jour avec succès",
      application: {
        id: application._id,
        status: application.status,
        reviewedAt: application.reviewedAt,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Routes pour les réclamations
app.get("/api/admin/complaints", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const complaints = await Complaint.find().populate("userId", "firstName lastName email")
    res.status(200).json(complaints)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.put("/api/admin/complaints/:id", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const { status, response } = req.body

    if (!["pending", "in-progress", "resolved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" })
    }

    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) {
      return res.status(404).json({ message: "Réclamation non trouvée" })
    }

    complaint.status = status
    complaint.response = response || complaint.response

    if (status === "resolved" || status === "rejected") {
      complaint.resolvedAt = Date.now()
    }

    await complaint.save()

    res.status(200).json({
      message: "Réclamation mise à jour avec succès",
      complaint: {
        id: complaint._id,
        subject: complaint.subject,
        status: complaint.status,
        response: complaint.response,
        resolvedAt: complaint.resolvedAt,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour répondre aux réclamations (POST)
app.post("/api/admin/complaints/:id/respond", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const { status, response } = req.body

    if (!["pending", "in-progress", "resolved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" })
    }

    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) {
      return res.status(404).json({ message: "Réclamation non trouvée" })
    }

    complaint.status = status
    complaint.response = response || complaint.response

    if (status === "resolved" || status === "rejected") {
      complaint.resolvedAt = Date.now()
    }

    await complaint.save()

    res.status(200).json({
      message: "Réclamation traitée avec succès",
      complaint: {
        id: complaint._id,
        subject: complaint.subject,
        status: complaint.status,
        response: complaint.response,
        resolvedAt: complaint.resolvedAt,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/admin/test-results", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    const results = await TestResult.find()
      .populate("userId", "firstName lastName email")
      .populate("testId", "title passingScore")

    res.status(200).json(results)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/admin/statistics", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    // Statistiques des utilisateurs
    const userStats = await User.aggregate([
      { $group: { _id: { role: "$role", status: "$status" }, count: { $sum: 1 } } },
    ])

    // Statistiques des tests
    const testStats = await TestResult.aggregate([
      { $group: { _id: "$passed", count: { $sum: 1 }, avgScore: { $avg: "$score" } } },
    ])

    // Statistiques des formations
    const trainingStats = await TrainingProgress.aggregate([
      { $group: { _id: "$completed", count: { $sum: 1 }, avgProgress: { $avg: "$progress" } } },
    ])

    // Statistiques des réclamations
    const complaintStats = await Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])

    // Statistiques des documents
    const documentStats = await Document.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])

    // Statistiques détaillées
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ status: "active" })
    const totalTests = await Test.countDocuments()
    const totalTrainings = await Training.countDocuments()
    const totalMessages = await Message.countDocuments()

    // Activité récente
    const recentActivity = {
      newUsersThisWeek: await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      testsCompletedThisWeek: await TestResult.countDocuments({
        completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      trainingsCompletedThisWeek: await TrainingProgress.countDocuments({
        completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      messagesThisWeek: await Message.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    }

    res.status(200).json({
      userStats,
      testStats,
      trainingStats,
      complaintStats,
      documentStats,
      summary: {
        totalUsers,
        activeUsers,
        totalTests,
        totalTrainings,
        totalMessages,
      },
      recentActivity,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// ==================== ROUTES DE MESSAGERIE ====================

// Route pour récupérer tous les utilisateurs pour la messagerie
app.get("/api/messaging/users", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id
    const currentUserRole = req.user.role

    let users = []

    if (currentUserRole === "admin") {
      // Admin peut parler à tous les utilisateurs
      users = await User.find({ _id: { $ne: currentUserId } }).select("firstName lastName email role")
    } else if (currentUserRole === "responsable") {
      // Responsable peut parler aux admins et workers
      users = await User.find({
        _id: { $ne: currentUserId },
        role: { $in: ["admin", "worker"] },
      }).select("firstName lastName email role")
    } else if (currentUserRole === "worker") {
      // Worker peut parler aux admins et responsables
      users = await User.find({
        _id: { $ne: currentUserId },
        role: { $in: ["admin", "responsable"] },
      }).select("firstName lastName email role")
    }

    res.status(200).json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/messages/conversations", authenticateToken, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(req.user.id) },
            { receiverId: new mongoose.Types.ObjectId(req.user.id) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$senderId", new mongoose.Types.ObjectId(req.user.id)] }, "$receiverId", "$senderId"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $eq: ["$receiverId", new mongoose.Types.ObjectId(req.user.id)] }, { $eq: ["$read", false] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          "user.firstName": 1,
          "user.lastName": 1,
          "user.email": 1,
          "user.role": 1,
          lastMessage: 1,
          unreadCount: 1,
        },
      },
    ])

    res.status(200).json(conversations)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/messages/:userId", authenticateToken, async (req, res) => {
  try {
    const otherUserId = req.params.userId

    const otherUser = await User.findById(otherUserId)
    if (!otherUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user.id },
      ],
    }).sort({ createdAt: 1 })

    await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: req.user.id,
        read: false,
      },
      { $set: { read: true } },
    )

    res.status(200).json(messages)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.post("/api/messages/:userId", authenticateToken, async (req, res) => {
  try {
    const { content } = req.body
    const receiverId = req.params.userId

    const receiver = await User.findById(receiverId)
    if (!receiver) {
      return res.status(404).json({ message: "Destinataire non trouvé" })
    }

    const message = new Message({
      senderId: req.user.id,
      receiverId,
      content,
    })

    await message.save()

    res.status(201).json({
      message: "Message envoyé avec succès",
      data: message,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// ==================== ROUTES PUBLIQUES ====================

// Route pour les offres d'emploi publiques
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" })
    res.status(200).json(jobs)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route de test
app.get("/", (req, res) => {
  res.json({ message: "Serveur de recrutement en cours d'exécution" })
})

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`)
})
