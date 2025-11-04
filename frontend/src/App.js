import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import EnhancedDashboard from './components/dashboard';
import Itinerary from './components/Itinerary';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import Weather from "./components/weather";
import AIDynamicTripPlanner from "./components/AIDynamicTripPlanner";
import AITravelCompanion from './components/AITravelCompanion';
import LLMReviewAnalyzer from './components/LLMReviewAnalyzer';
import Interactive3DWorldMap from './components/Interactive3DWorldMap';
import SmartRemindersCalendar from './components/SmartRemindersCalendar';
import ARLocationDiscovery from './components/ARLocationDiscovery';
import SocialTravelNetwork from './components/SocialTravelNetwork';
import PredictiveTravelAnalytics from './components/PredictiveTravelAnalytics';
import MultiModalAIAssistant from './components/MultiModalAIAssistant';
import AdaptiveAITravelCompanion from './components/AdaptiveAITravelCompanion';
import AIFinanceTracker from './components/AIFinanceTracker';
import PredictiveInsights from './components/PredictiveInsights';
import SmartPackingAssistant from './components/SmartPackingAssistant';
import AIMoodStoryGenerator from './components/AIMoodStoryGenerator';
import AITripCreator from './components/AITripCreator';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <EnhancedDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itinerary"
            element={
              <ProtectedRoute>
                <Itinerary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dynamic-planner"
            element={
              <ProtectedRoute>
                <AIDynamicTripPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-companion"
            element={
              <ProtectedRoute>
                <AITravelCompanion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review-analyzer"
            element={
              <ProtectedRoute>
                <LLMReviewAnalyzer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/world-map"
            element={
              <ProtectedRoute>
                <Interactive3DWorldMap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/smart-reminders"
            element={
              <ProtectedRoute>
                <SmartRemindersCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ar-discovery"
            element={
              <ProtectedRoute>
                <ARLocationDiscovery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/social-network"
            element={
              <ProtectedRoute>
                <SocialTravelNetwork />
              </ProtectedRoute>
            }
          />
          <Route
            path="/predictive-analytics"
            element={
              <ProtectedRoute>
                <PredictiveTravelAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/multimodal-ai"
            element={
              <ProtectedRoute>
                <MultiModalAIAssistant />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adaptive-ai"
            element={
              <ProtectedRoute>
                <AdaptiveAITravelCompanion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-finance"
            element={
              <ProtectedRoute>
                <AIFinanceTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/predictive-insights"
            element={
              <ProtectedRoute>
                <PredictiveInsights />
              </ProtectedRoute>
            }
          />
          <Route
            path="/smart-packing"
            element={
              <ProtectedRoute>
                <SmartPackingAssistant />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-mood-story"
            element={
              <ProtectedRoute>
                <AIMoodStoryGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip-creator"
            element={
              <ProtectedRoute>
                <AITripCreator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip-planner"
            element={
              <ProtectedRoute>
                <AIDynamicTripPlanner />
              </ProtectedRoute>
            }
          />
          <Route path="/weather" element={<Weather />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
