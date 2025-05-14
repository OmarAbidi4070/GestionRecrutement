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
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  answers: [
    {
      questionId: { type: String, required: true },
      selectedOption: { type: String, required: true },
      isCorrect: { type: Boolean, required: true },
    },
  ],
  completedAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  status: { type: String },
})

const TrainingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String, required: true },
  duration: { type: Number, required: true }, // en minutes
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
})

const TrainingProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: "Training", required: true },
  progress: { type: Number, default: 0 }, // pourcentage
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

const upload = multer({ storage })

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

// Appel de la fonction pour créer l'admin par défaut
createDefaultAdmin()

// Routes d'authentification - CORRECTION: Ajout du segment /auth/ dans les routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer un nouvel utilisateur
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      // Activer automatiquement les travailleurs, mais pas les responsables
      status: role === "worker" ? "active" : "pending",
    })

    await user.save()

    res.status(201).json({ message: "Utilisateur enregistré avec succès" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Corriger le problème de connexion du responsable
// Dans la route de login, assurez-vous que le rôle "responsable" est correctement géré
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" })
    }

    // Vérifier si le compte est actif
    if (user.status !== "active") {
      return res.status(403).json({ message: "Votre compte est en attente d'approbation ou a été rejeté" })
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" })
    }

    // Créer et signer le token JWT
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

// Ajouter la route /api/auth/me pour vérifier l'authentification
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

// Routes pour les workers
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

app.put("/api/worker/profile", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    user.firstName = firstName || user.firstName
    user.lastName = lastName || user.lastName
    user.email = email || user.email

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

app.post("/api/worker/documents", authenticateToken, authorize(["worker"]), upload.single("file"), async (req, res) => {
  try {
    const { title } = req.body

    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier téléchargé" })
    }

    const document = new Document({
      userId: req.user.id,
      title,
      filePath: req.file.path,
      fileType: req.file.mimetype,
    })

    await document.save()

    res.status(201).json({
      message: "Document téléchargé avec succès",
      document: {
        id: document._id,
        title: document.title,
        status: document.status,
        uploadedAt: document.uploadedAt,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
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

app.get("/api/worker/tests", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    // Récupérer tous les tests disponibles
    const tests = await Test.find().select("title description passingScore")

    // Récupérer les résultats de tests de l'utilisateur
    const results = await TestResult.find({ userId: req.user.id })

    // Mapper les tests avec les résultats
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

app.get("/api/worker/tests/:id", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
    if (!test) {
      return res.status(404).json({ message: "Test non trouvé" })
    }

    // Vérifier si l'utilisateur a déjà passé ce test
    const existingResult = await TestResult.findOne({
      userId: req.user.id,
      testId: test._id,
    })

    if (existingResult) {
      return res.status(400).json({
        message: "Vous avez déjà passé ce test",
        result: {
          score: existingResult.score,
          passed: existingResult.passed,
          completedAt: existingResult.completedAt,
        },
      })
    }

    // Retourner le test sans les réponses correctes
    const testWithoutAnswers = {
      id: test._id,
      title: test.title,
      description: test.description,
      questions: test.questions.map((q) => ({
        id: q._id,
        text: q.text,
        options: q.options.map((o) => ({
          id: o._id,
          text: o.text,
        })),
      })),
    }

    res.status(200).json(testWithoutAnswers)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.post("/api/worker/tests/:id/submit", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    const { answers } = req.body

    const test = await Test.findById(req.params.id)
    if (!test) {
      return res.status(404).json({ message: "Test non trouvé" })
    }

    // Vérifier si l'utilisateur a déjà passé ce test
    const existingResult = await TestResult.findOne({
      userId: req.user.id,
      testId: test._id,
    })

    if (existingResult) {
      return res.status(400).json({ message: "Vous avez déjà passé ce test" })
    }

    // Calculer le score
    let correctAnswers = 0
    const processedAnswers = []

    answers.forEach((answer) => {
      const question = test.questions.id(answer.questionId)
      if (!question) return

      const selectedOption = question.options.id(answer.selectedOptionId)
      if (!selectedOption) return

      const isCorrect = selectedOption.isCorrect
      if (isCorrect) correctAnswers++

      processedAnswers.push({
        questionId: answer.questionId,
        selectedOption: answer.selectedOptionId,
        isCorrect,
      })
    })

    const totalQuestions = test.questions.length
    const score = Math.round((correctAnswers / totalQuestions) * 100)
    const passed = score >= test.passingScore

    // Enregistrer le résultat
    const result = new TestResult({
      userId: req.user.id,
      testId: test._id,
      score,
      passed,
      answers: processedAnswers,
    })

    await result.save()

    res.status(200).json({
      message: "Test soumis avec succès",
      result: {
        score,
        passed,
        correctAnswers,
        totalQuestions,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.get("/api/worker/trainings", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    // Récupérer toutes les formations disponibles
    const trainings = await Training.find().select("title description duration")

    // Récupérer les progrès de l'utilisateur
    const progress = await TrainingProgress.find({ userId: req.user.id })

    // Mapper les formations avec les progrès
    const trainingsWithProgress = trainings.map((training) => {
      const userProgress = progress.find((p) => p.trainingId.toString() === training._id.toString())
      return {
        id: training._id,
        title: training.title,
        description: training.description,
        duration: training.duration,
        progress: userProgress
          ? {
              percentage: userProgress.progress,
              completed: userProgress.completed,
              startedAt: userProgress.startedAt,
              completedAt: userProgress.completedAt,
            }
          : null,
      }
    })

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

    // Récupérer les progrès de l'utilisateur pour cette formation
    let userProgress = await TrainingProgress.findOne({
      userId: req.user.id,
      trainingId: training._id,
    })

    // Si aucun progrès n'existe, créer une nouvelle entrée
    if (!userProgress) {
      userProgress = new TrainingProgress({
        userId: req.user.id,
        trainingId: training._id,
      })
      await userProgress.save()
    }

    res.status(200).json({
      id: training._id,
      title: training.title,
      description: training.description,
      content: training.content,
      duration: training.duration,
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

    // Si la formation est terminée
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

// Ajouter la route manquante pour les tests assignés
app.get("/api/worker/assigned-test", authenticateToken, authorize(["worker"]), async (req, res) => {
  try {
    // Rechercher un test assigné à l'utilisateur
    const testAssignment = await TestResult.findOne({
      userId: req.user.id,
      status: { $exists: false }, // Tests qui n'ont pas encore été complétés
    }).populate({
      path: "testId",
      select: "title description questions passingScore",
    })

    if (!testAssignment) {
      return res.status(404).json({ message: "Aucun test assigné" })
    }

    // Formater la réponse pour ne pas inclure les réponses correctes
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

// Ajouter les routes pour gérer les tests et les résultats
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

    // Vérifier si la question existe dans le test
    const test = await Test.findById(testAssignment.testId)
    const question = test.questions.id(questionId)

    if (!question) {
      return res.status(404).json({ message: "Question non trouvée" })
    }

    // Vérifier si l'option sélectionnée est correcte
    const option = question.options.id(selectedOption)
    if (!option) {
      return res.status(404).json({ message: "Option non trouvée" })
    }

    // Ajouter ou mettre à jour la réponse
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

    // Calculer le score
    const totalQuestions = testAssignment.testId.questions.length
    const correctAnswers = testAssignment.answers.filter((a) => a.isCorrect).length
    const score = Math.round((correctAnswers / totalQuestions) * 100)
    const passed = score >= testAssignment.testId.passingScore

    // Mettre à jour le résultat du test
    testAssignment.score = score
    testAssignment.passed = passed
    testAssignment.completedAt = new Date()
    testAssignment.status = "completed"

    await testAssignment.save()

    // Notifier le responsable (dans un système réel, on pourrait envoyer un email ou une notification)
    // Pour l'instant, nous allons simplement enregistrer un message dans la console
    console.log(`Test complété par l'utilisateur ${req.user.id} avec un score de ${score}%`)

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

// Routes pour les responsables
app.get("/api/responsable/dashboard", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    // Nombre de candidats en attente
    const pendingUsers = await User.countDocuments({ role: "worker", status: "pending" })

    // Nombre de documents en attente de vérification
    const pendingDocuments = await Document.countDocuments({ status: "pending" })

    // Nombre de tests créés par ce responsable
    const tests = await Test.countDocuments({ createdBy: req.user.id })

    // Résultats récents des tests
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

// Améliorer la route de création de test pour le responsable
app.post("/api/responsable/tests", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const { title, description, passingScore, questions } = req.body

    // Validation
    if (!title) {
      return res.status(400).json({ message: "Le titre du test est requis" })
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Le test doit contenir au moins une question" })
    }

    // Vérifier que chaque question a au moins une option correcte
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

// Ajouter une route pour assigner un test à un travailleur
app.post("/api/responsable/assign-test", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const { userId, testId } = req.body

    // Vérifier si l'utilisateur existe et est un travailleur
    const user = await User.findOne({ _id: userId, role: "worker" })
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé ou n'est pas un travailleur" })
    }

    // Vérifier si le test existe
    const test = await Test.findById(testId)
    if (!test) {
      return res.status(404).json({ message: "Test non trouvé" })
    }

    // Vérifier si l'utilisateur a déjà un test assigné non complété
    const existingAssignment = await TestResult.findOne({
      userId,
      status: { $ne: "completed" },
    })

    if (existingAssignment) {
      return res.status(400).json({ message: "Cet utilisateur a déjà un test assigné" })
    }

    // Créer une nouvelle assignation de test
    const testResult = new TestResult({
      userId,
      testId,
      score: 0,
      passed: false,
      answers: [],
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

// Ajouter une route pour voir les résultats des tests
app.get("/api/responsable/test-results", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    // Récupérer les tests créés par ce responsable
    const tests = await Test.find({ createdBy: req.user.id }).select("_id")
    const testIds = tests.map((test) => test._id)

    // Récupérer les résultats pour ces tests
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

    // Vérifier si des résultats existent pour ce test
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

app.get("/api/responsable/trainings", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const trainings = await Training.find({ createdBy: req.user.id })
    res.status(200).json(trainings)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

app.post("/api/responsable/trainings", authenticateToken, authorize(["responsable"]), async (req, res) => {
  try {
    const { title, description, content, duration } = req.body

    const training = new Training({
      title,
      description,
      content,
      duration,
      createdBy: req.user.id,
    })

    await training.save()

    res.status(201).json({
      message: "Formation créée avec succès",
      training: {
        id: training._id,
        title: training.title,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
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

    // Vérifier si des progrès existent pour cette formation
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

// Routes pour les admins
app.get("/api/admin/dashboard", authenticateToken, authorize(["admin"]), async (req, res) => {
  try {
    // Nombre total d'utilisateurs par rôle
    const usersByRole = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])

    // Nombre d'utilisateurs en attente d'approbation
    const pendingUsers = await User.countDocuments({ status: "pending" })

    // Nombre de réclamations non résolues
    const pendingComplaints = await Complaint.countDocuments({ status: "pending" })

    // Statistiques des tests
    const testResults = await TestResult.aggregate([{ $group: { _id: "$passed", count: { $sum: 1 } } }])

    // Utilisateurs récemment inscrits
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

    // Empêcher la modification du statut de l'admin par défaut
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

    // Empêcher la suppression de l'admin par défaut
    if (user.email === "admin@gmail.com") {
      return res.status(403).json({ message: "Vous ne pouvez pas supprimer l'administrateur par défaut" })
    }

    // Supprimer les documents associés
    await Document.deleteMany({ userId: user._id })

    // Supprimer les résultats de tests associés
    await TestResult.deleteMany({ userId: user._id })

    // Supprimer les progrès de formation associés
    await TrainingProgress.deleteMany({ userId: user._id })

    // Supprimer les réclamations associées
    await Complaint.deleteMany({ userId: user._id })

    // Supprimer les messages associés
    await Message.deleteMany({ $or: [{ senderId: user._id }, { receiverId: user._id }] })

    // Supprimer l'utilisateur
    await user.deleteOne()

    res.status(200).json({ message: "Utilisateur et données associées supprimés avec succès" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

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

    if (!["pending", "in-progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" })
    }

    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) {
      return res.status(404).json({ message: "Réclamation non trouvée" })
    }

    complaint.status = status
    complaint.response = response || complaint.response

    if (status === "resolved") {
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

    res.status(200).json({
      userStats,
      testStats,
      trainingStats,
      complaintStats,
      documentStats,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Routes de messagerie
app.get("/api/messages/conversations", authenticateToken, async (req, res) => {
  try {
    // Trouver tous les utilisateurs avec qui l'utilisateur actuel a échangé des messages
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: mongoose.Types.ObjectId(req.user.id) },
            { receiverId: mongoose.Types.ObjectId(req.user.id) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$senderId", mongoose.Types.ObjectId(req.user.id)] }, "$receiverId", "$senderId"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $eq: ["$receiverId", mongoose.Types.ObjectId(req.user.id)] }, { $eq: ["$read", false] }],
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

    // Vérifier si l'autre utilisateur existe
    const otherUser = await User.findById(otherUserId)
    if (!otherUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    // Récupérer les messages entre les deux utilisateurs
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user.id },
      ],
    }).sort({ createdAt: 1 })

    // Marquer les messages non lus comme lus
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

    // Vérifier si le destinataire existe
    const receiver = await User.findById(receiverId)
    if (!receiver) {
      return res.status(404).json({ message: "Destinataire non trouvé" })
    }

    // Créer le message
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

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`)
})
