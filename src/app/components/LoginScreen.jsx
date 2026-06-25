import { useState } from "react";
import { 
  Eye, 
  EyeOff, 
  GraduationCap, 
  ArrowRight, 
  Chrome, 
  Building 
} from "lucide-react";

// ============ Constants ============
const ALLOWED_DOMAINS = ['university.edu', 'student.university.edu'];

// ============ Component ============
export function LoginScreen({ onLogin, onError }) {
  // ============ State ============
  const [isSignUp, setIsSignUp] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============ Validation ============
  const isValidEmail = (email) => {
    return ALLOWED_DOMAINS.some(domain => email.endsWith(`@${domain}`));
  };

  const validateSignUp = () => {
    if (!fullName.trim() || !email.trim() || !studentId.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (!isValidEmail(email)) {
      setError("Please use your university email address.");
      return false;
    }
    return true;
  };

  const validateLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return false;
    }
    return true;
  };

  // ============ Handlers ============
  const handleSubmit = async () => {
    setError("");
    
    if (isSignUp) {
      if (!validateSignUp()) return;
      // For demo: sign up would need a registration endpoint
      setError("Please use SSO with your university account to sign up.");
      return;
    } else {
      if (!validateLogin()) return;
    }
    
    setLoading(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      if (onLogin) onLogin();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = (provider) => {
    console.log(`SSO login with ${provider}`);
    if (onLogin) onLogin();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // ============ Render ============
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8]">
      {/* Top hero */}
      <div className="bg-[#f97316] pt-12 sm:pt-20 pb-10 sm:pb-14 px-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <h1 className="text-white mb-1">CampusEats</h1>
        <p className="text-orange-100 text-sm sm:text-base">Order ahead. Skip the queue.</p>
      </div>

      {/* Wave divider */}
      <div className="bg-[#f97316]">
        <svg viewBox="0 0 1200 48" className="w-full" preserveAspectRatio="none" height="48">
          <path d="M0,0 C400,48 800,48 1200,0 L1200,48 L0,48 Z" fill="#fafaf8" />
        </svg>
      </div>

      {/* Form container */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 pb-8">
        <div className="w-full max-w-md space-y-4 sm:space-y-5" onKeyDown={handleKeyDown}>
          
          {/* SSO Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => handleSSO('google')}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl py-3 sm:py-3.5 text-sm sm:text-base flex items-center justify-center gap-2 transition-colors"
            >
              <Chrome className="w-4 h-4 sm:w-5 sm:h-5" />
              {isSignUp ? "Sign up" : "Sign in"} with Google
            </button>
            <button
              onClick={() => handleSSO('microsoft')}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl py-3 sm:py-3.5 text-sm sm:text-base flex items-center justify-center gap-2 transition-colors"
            >
              <Building className="w-4 h-4 sm:w-5 sm:h-5" />
              {isSignUp ? "Sign up" : "Sign in"} with Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs sm:text-sm text-gray-400">or use email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setError(""); }}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">University Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="e.g. student@university.edu"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
            </>
          )}

          {!isSignUp && (
            <div>
              <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Enter your email"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => { setStudentId(e.target.value); setError(""); }}
                placeholder="e.g. IDTB123456"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>
          )}

          <div>
            <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder={isSignUp ? "Create a password (min. 6 characters)" : "Enter your password"}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 pr-11 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
              />
              <button
                onClick={() => setShowPass((v) => !v)}
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  placeholder="Re-enter your password"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 pr-11 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <button
                  onClick={() => setShowConfirmPass((v) => !v)}
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs sm:text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {!isSignUp && (
            <div className="flex justify-end">
              <button type="button" className="text-xs sm:text-sm text-[#f97316] hover:text-orange-600 transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#f97316] hover:bg-orange-600 text-white rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-[#f97316] transition-colors mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                {isSignUp ? "Creating account…" : "Signing in…"}
              </>
            ) : (
              <>
                {isSignUp ? "Create Account" : "Sign In"}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </>
            )}
          </button>

          {/* Toggle Sign In / Sign Up */}
          <div className="text-center pt-2">
            <p className="text-xs sm:text-sm text-gray-500">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              {" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setFullName("");
                  setConfirmPassword("");
                }}
                className="text-[#f97316] hover:text-orange-600 transition-colors font-medium"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs sm:text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* SSO option */}
          <button 
            onClick={() => handleSSO('google')}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl py-3 sm:py-3.5 text-sm sm:text-base flex items-center justify-center gap-2 transition-colors"
          >
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            {isSignUp ? "Sign up" : "Sign in"} with Student Portal
          </button>

          <p className="text-center text-xs sm:text-sm text-gray-400 pt-4">
            Having trouble? Contact your school's IT helpdesk.
          </p>
        </div>
      </div>
    </div>
  );
}
