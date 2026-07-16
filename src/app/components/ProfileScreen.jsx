import { useState } from "react";
import { ArrowLeft, CheckCircle2, Lock, Save, Wallet } from "lucide-react";
import { fetchJson, updateStoredUser } from "../lib/api";

export function ProfileScreen({ user, onBack, onUserUpdate }) {
  const isStudent = user?.role === "student";
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    studentId: user?.studentId || "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const updateProfileField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setError("");
    setProfileMessage("");
  };

  const updatePasswordField = (field, value) => {
    setPasswords((current) => ({ ...current, [field]: value }));
    setError("");
    setPasswordMessage("");
  };

  const saveProfile = async () => {
    setError("");
    setProfileMessage("");
    setSavingProfile(true);

    try {
      const profilePayload = {
        name: profile.name,
        email: profile.email,
      };

      if (isStudent) {
        profilePayload.studentId = profile.studentId;
      }

      const data = await fetchJson("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      updateStoredUser(data.user);
      onUserUpdate(data.user);
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    setError("");
    setPasswordMessage("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      const data = await fetchJson("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage(data.message || "Password changed successfully.");
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-gray-900">My Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5">
        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {isStudent && (
          <section className="bg-white border border-gray-100 rounded-xl px-4 sm:px-5 py-4 sm:py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-[#f97316]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-gray-900">E-Wallet Balance</h2>
              </div>
            </div>
            <p className="text-2xl text-[#f97316] shrink-0">${Number(user?.walletBalance || 0).toFixed(2)}</p>
          </section>
        )}

        <section className="bg-white border border-gray-100 rounded-xl px-4 sm:px-5 py-4 sm:py-5 space-y-4">
          <div>
            <h2 className="text-gray-900">Profile Information</h2>
          </div>
          <ProfileInput label="Full Name" value={profile.name} onChange={(value) => updateProfileField("name", value)} />
          <ProfileInput label="Email" type="email" value={profile.email} onChange={(value) => updateProfileField("email", value)} />
          {isStudent && (
            <ProfileInput label="Student ID" value={profile.studentId} onChange={(value) => updateProfileField("studentId", value)} />
          )}
          {profileMessage && <SuccessText text={profileMessage} />}
          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile}
            className="w-full sm:w-auto bg-[#f97316] hover:bg-orange-600 text-white rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
          >
            <Save className="w-4 h-4" />
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl px-4 sm:px-5 py-4 sm:py-5 space-y-4">
          <div>
            <h2 className="text-gray-900">Change Password</h2>
          </div>
          <ProfileInput label="Current Password" type="password" value={passwords.currentPassword} onChange={(value) => updatePasswordField("currentPassword", value)} />
          <ProfileInput label="New Password" type="password" value={passwords.newPassword} onChange={(value) => updatePasswordField("newPassword", value)} />
          <ProfileInput label="Confirm New Password" type="password" value={passwords.confirmPassword} onChange={(value) => updatePasswordField("confirmPassword", value)} />
          {passwordMessage && <SuccessText text={passwordMessage} />}
          <button
            type="button"
            onClick={changePassword}
            disabled={savingPassword}
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
          >
            <Lock className="w-4 h-4" />
            {savingPassword ? "Changing..." : "Change Password"}
          </button>
        </section>
      </div>
    </div>
  );
}

function ProfileInput({ label, type = "text", value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs sm:text-sm text-gray-500 mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 transition-all"
      />
    </label>
  );
}

function SuccessText({ text }) {
  return (
    <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4" />
      {text}
    </p>
  );
}
