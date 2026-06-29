import { useState } from "react";
import {
  ArrowRight,
  Building,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  Store,
} from "lucide-react";
import { fetchJson, saveAuthSession } from "../lib/api";

export function LoginScreen({ onLogin, onError }) {
  const [loginType, setLoginType] = useState("student");
  const [studentMode, setStudentMode] = useState("signin");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupStudentId, setSignupStudentId] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateStudentLogin = () => {
    if (!studentEmail.trim() || !studentPassword.trim()) {
      setError("Please enter your student email and password.");
      return false;
    }

    return true;
  };

  const validateStudentSignup = () => {
    if (!signupName.trim() || !signupStudentId.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setError("Please complete all student account fields.");
      return false;
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  const validateStaffLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return false;
    }

    return true;
  };

  const handleStudentLogin = async () => {
    setError("");

    if (!validateStudentLogin()) return;

    setLoading(true);

    try {
      const data = await fetchJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "student",
          email: studentEmail.trim(),
          password: studentPassword,
        }),
      });

      saveAuthSession(data);
      if (onLogin) onLogin(data.user);
    } catch (err) {
      const errorMessage = err.message || "Student login failed. Please try again.";
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSignup = async () => {
    setError("");

    if (!validateStudentSignup()) return;

    setLoading(true);

    try {
      const data = await fetchJson("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName.trim(),
          studentId: signupStudentId.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
        }),
      });

      saveAuthSession(data);
      if (onLogin) onLogin(data.user);
    } catch (err) {
      const errorMessage = err.message || "Account creation failed. Please try again.";
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async () => {
    setError("");

    if (!validateStaffLogin()) return;

    setLoading(true);

    try {
      const data = await fetchJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "staff",
          email: email.trim(),
          password,
        }),
      });

      saveAuthSession(data);
      if (onLogin) onLogin(data.user);
    } catch (err) {
      const errorMessage = err.message || "Login failed. Please try again.";
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;

    if (loginType === "student") {
      if (studentMode === "signin") {
        handleStudentLogin();
      } else {
        handleStudentSignup();
      }
    } else {
      handleStaffLogin();
    }
  };

  const selectLoginType = (type) => {
    setLoginType(type);
    setError("");
  };

  const selectStudentMode = (mode) => {
    setStudentMode(mode);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8]">
      <div className="bg-[#f97316] pt-12 sm:pt-20 pb-10 sm:pb-14 px-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <h1 className="text-white mb-1">CampusEats</h1>
        <p className="text-orange-100 text-sm sm:text-base">Order ahead. Skip the queue.</p>
      </div>

      <div className="bg-[#f97316]">
        <svg viewBox="0 0 1200 48" className="w-full" preserveAspectRatio="none" height="48">
          <path d="M0,0 C400,48 800,48 1200,0 L1200,48 L0,48 Z" fill="#fafaf8" />
        </svg>
      </div>

      <div className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 pb-8">
        <div className="w-full max-w-md space-y-4 sm:space-y-5" onKeyDown={handleKeyDown}>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-white border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => selectLoginType("student")}
              className={`rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors ${
                loginType === "student" ? "bg-[#f97316] text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => selectLoginType("staff")}
              className={`rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors ${
                loginType === "staff" ? "bg-[#f97316] text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin/Vendor
            </button>
          </div>

          {loginType === "student" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-white border border-gray-200 p-1">
                <button
                  type="button"
                  onClick={() => selectStudentMode("signin")}
                  className={`rounded-lg py-2.5 text-sm transition-colors ${
                    studentMode === "signin" ? "bg-orange-100 text-[#f97316]" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => selectStudentMode("signup")}
                  className={`rounded-lg py-2.5 text-sm transition-colors ${
                    studentMode === "signup" ? "bg-orange-100 text-[#f97316]" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Create account
                </button>
              </div>

              {studentMode === "signin" ? (
                <>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => {
                        setStudentEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your email"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input
                        type={showStudentPass ? "text" : "password"}
                        value={studentPassword}
                        onChange={(e) => {
                          setStudentPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Enter your password"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 pr-11 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                      />
                      <button
                        onClick={() => setShowStudentPass((value) => !value)}
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showStudentPass ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => {
                        setSignupName(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your name"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Student ID</label>
                    <input
                      type="text"
                      value={signupStudentId}
                      onChange={(e) => {
                        setSignupStudentId(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your student ID"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your email"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input
                        type={showSignupPass ? "text" : "password"}
                        value={signupPassword}
                        onChange={(e) => {
                          setSignupPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Create a password"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 pr-11 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                      />
                      <button
                        onClick={() => setShowSignupPass((value) => !value)}
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showSignupPass ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={studentMode === "signin" ? handleStudentLogin : handleStudentSignup}
                disabled={loading}
                className="w-full bg-[#f97316] hover:bg-orange-600 text-white rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-[#f97316] transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    {studentMode === "signin" ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    {studentMode === "signin" ? "Sign in" : "Create account"}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>

              {studentMode === "signin" ? (
                <p className="text-center text-xs sm:text-sm text-gray-400">
                  Demo student: student@campuseats.test / student123.
                </p>
              ) : (
                <p className="text-center text-xs sm:text-sm text-gray-400">
                  Student accounts are created as active CampusEats users.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter admin or vendor email"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-500 mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 pr-11 text-sm sm:text-base text-gray-800 placeholder-gray-300 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                  <button
                    onClick={() => setShowPass((value) => !value)}
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs sm:text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {loginType === "staff" && (
            <>
              <div className="flex justify-end">
                <button type="button" className="text-xs sm:text-sm text-[#f97316] hover:text-orange-600 transition-colors">
                  Forgot password?
                </button>
              </div>

              <button
                onClick={handleStaffLogin}
                disabled={loading}
                className="w-full bg-[#f97316] hover:bg-orange-600 text-white rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-[#f97316] transition-colors mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-xs sm:text-sm text-gray-400">
                Vendor accounts are created by an admin.
              </p>
              <p className="text-center text-xs sm:text-sm text-gray-400">
                Admin: admin@campuseats.test / admin123
                <br />
                Vendor: vendor@campuseats.test / vendor123
              </p>
            </>
          )}

          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-400 pt-2">
            {loginType === "student" ? <Building className="w-4 h-4" /> : <Store className="w-4 h-4" />}
            <span>{loginType === "student" ? "Sign in with your CampusEats account." : "No public vendor registration."}</span>
          </div>

          <p className="text-center text-xs sm:text-sm text-gray-400 pt-4">
            Having trouble? Contact your school's IT helpdesk.
          </p>
        </div>
      </div>
    </div>
  );
}
