import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Plane, Camera, Eye, EyeOff, Cloud } from 'lucide-react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(username.trim(), password);
 
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 
                    bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 
                    relative overflow-hidden">

      {/* Animated Clouds */}
      <div className="absolute top-10 left-0 animate-clouds">
        <Cloud className="w-24 h-24 text-white/30" />
      </div>
      <div className="absolute top-32 left-10 animate-clouds delay-10000">
        <Cloud className="w-32 h-32 text-white/20" />
      </div>
      <div className="absolute top-20 left-20 animate-clouds delay-20000">
        <Cloud className="w-28 h-28 text-white/25" />
      </div>

      {/* Animated Airplane */}
      <div className="absolute top-1/3 -left-20 w-12 h-12 text-white/80 animate-airplane">
        <Plane className="w-full h-full" />
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full animate-fade-in z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white/30 backdrop-blur-lg rounded-full p-3 shadow-lg">
              <Plane className="h-12 w-12 text-white drop-shadow-md" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg mb-2 tracking-wide">
            Wanderlust
          </h1>
          <p className="text-white/90 text-lg italic">
            Discover amazing places near you
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl 
                        border border-white/30 p-8 relative overflow-hidden">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Welcome Back
          </h2>

          {error && (
            <div className="bg-red-500/30 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-white/90 text-sm font-semibold mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/30 border border-white/40 
                           rounded-lg text-white placeholder-white/70 
                           focus:outline-none focus:ring-2 focus:ring-yellow-300 
                           focus:border-transparent transition"
                placeholder="Enter your username"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/90 text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/30 border border-white/40 
                             rounded-lg text-white placeholder-white/70 
                             focus:outline-none focus:ring-2 focus:ring-yellow-300 
                             focus:border-transparent transition"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-white/70 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 via-red-400 to-orange-400 
                         hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg 
                         shadow-lg hover:shadow-xl transition duration-200 
                         disabled:opacity-50 flex items-center justify-center mt-6"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 
                                border-white/30 border-t-white"></div>
              ) : (
                <>
                  <MapPin className="h-5 w-5 mr-2" />
                  Start Exploring
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-white/90">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-yellow-300 hover:text-white font-semibold transition"
              >
                Sign up now
              </Link>
            </p>
          </div>

          {/* Footer Icons */}
          <div className="flex justify-center space-x-6 mt-6 pt-6 border-t border-white/30">
            <Camera className="h-6 w-6 text-white/70 hover:text-white transition" />
            <MapPin className="h-6 w-6 text-white/70 hover:text-white transition" />
            <Plane className="h-6 w-6 text-white/70 hover:text-white transition" />
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-4 text-center">

        </div>
      </div>
    </div>
  );
}

export default Login;
