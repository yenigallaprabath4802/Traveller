const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Middleware
app.use(cors());
app.use(express.json());
const weather = require("./routes/weather");
const itinerary = require("./routes/itinerary");
const expenses = require("./routes/expenses");
const pois = require("./routes/pois");
const dynamicItinerary = require("./routes/dynamicItinerary");
const aiCompanion = require("./routes/aiCompanion");
const reviewAnalyzer = require("./routes/reviewAnalyzer");
const smartReminders = require("./routes/smartReminders");
const arLocation = require("./routes/arLocation");
const socialTravel = require("./routes/socialTravel");
const predictiveAnalytics = require("./routes/predictiveAnalytics");
const multiModalAI = require("./routes/multiModalAI");
const behaviorAnalytics = require("./routes/behaviorAnalytics");
const adaptiveAICompanion = require("./routes/adaptiveAICompanion");
const contextualChat = require("./routes/contextualChat");
const enhancedMultimodal = require("./routes/enhancedMultimodal");
const liveTravelData = require("./routes/liveTravelData");
const aiFinance = require("./routes/aiFinance");
const predictiveInsights = require("./routes/predictiveInsights");
const smartPacking = require("./routes/smartPacking");
const aiMoodStory = require("./routes/aiMoodStory");
const aiItinerary = require("./routes/aiItinerary");
// Routes
app.use('/api/itinerary', itinerary);
app.use('/api/expenses', expenses);
app.use('/api/weather', weather);
app.use('/api/pois', pois);
app.use('/api/dynamic-itinerary', dynamicItinerary);
app.use('/api/aicompanion', aiCompanion);
app.use('/api/review-analyzer', reviewAnalyzer);
app.use('/api/smart-reminders', smartReminders);
app.use('/api/ar-location', arLocation);
app.use('/api/social', socialTravel);
app.use('/api/predictive-analytics', predictiveAnalytics);
app.use('/api/multimodal', multiModalAI);
app.use('/api/behavior', behaviorAnalytics);
app.use('/api/adaptive-ai', adaptiveAICompanion);
app.use('/api/contextual-chat', contextualChat);
app.use('/api/enhanced-multimodal', enhancedMultimodal);
app.use('/api/live-travel', liveTravelData);
app.use('/api/ai-finance', aiFinance);
app.use('/api/predictive', predictiveInsights);
app.use('/api/smart-packing', smartPacking);
app.use('/api/ai-mood-story', aiMoodStory);
app.use('/api/ai-itinerary', aiItinerary);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/wanderlust";
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// ✅ Register API
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: "All fields required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ✅ Login API
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    if (!JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing. Check your .env file!");
      return res.status(500).json({ success: false, message: "Server error" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    res.json({ success: true, token, username: user.username });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});
app.get("/search-places", async (req, res) => {
  try {
    const { lat, lng, query } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat/lng" });
    }

    const fsqRes = await axios.get("https://api.foursquare.com/v3/places/search", {
      headers: {
        Authorization: "fsq3/ObXzA2vZpPJffKNBGCgAIpV+tqiSi1+Abh18bW8yAk=",  // keep secret
        Accept: "application/json",
        "X-Foursquare-API-Version": "2023-07-01"
      },
      params: {
        ll: `${lat},${lng}`,
        query: query || "hotel",
        limit: 10,
      },
    });

    res.json(fsqRes.data);
  } catch (err) {
    console.error("❌ Error fetching places:", err.response?.data || err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
