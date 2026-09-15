import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  isValidEmail,
  checkPassword,
  findUser,
  saveUser,
  StoredUser,
} from '../auth';

interface SignUpScreenProps {
  onSignUpSuccess: () => void;
  onGoToLogin: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUpSuccess,
  onGoToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field-level errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const clearErrors = () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
  };

  // Live password strength
  const strength = checkPassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    let hasError = false;

    if (!name.trim()) {
      setNameError('Full name is required');
      hasError = true;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setEmailError('Enter a valid email');
      hasError = true;
    } else if (findUser(email.trim())) {
      setEmailError('An account with this email already exists');
      hasError = true;
    }

    if (!password || !strength.valid) {
      setPasswordError(`Missing: ${strength.missing.join(', ')}`);
      hasError = true;
    }

    if (!confirmPassword || password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    const newUser: StoredUser = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      createdAt: new Date().toISOString(),
    };
    saveUser(newUser);

    setLoading(false);
    onSignUpSuccess();
  };

  // Strength indicator bar
  const passedCount = 4 - strength.missing.length;
  const strengthLabel =
    passedCount === 4 ? 'Strong' : passedCount >= 3 ? 'Good' : passedCount >= 2 ? 'Fair' : 'Weak';
  const strengthColor =
    passedCount === 4
      ? 'bg-emerald-500'
      : passedCount >= 3
      ? 'bg-blue-500'
      : passedCount >= 2
      ? 'bg-amber-400'
      : 'bg-red-400';

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#1d4ed8] flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-headline font-bold text-xl text-[#0b1c30] tracking-tight">
              LogiPredict AI
            </span>
          </div>
          <span className="text-xs font-medium px-3 py-1 bg-[#d3e4fe] text-[#374559] tracking-wider uppercase rounded">
            Ops Dispatch Console
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-[#e2e8f0] p-7 space-y-4">
          <div className="space-y-1">
            <h1 className="font-headline font-bold text-xl text-[#0b1c30]">
              Create your account
            </h1>
            <p className="text-xs text-[#64748b]">
              Set up your operator profile to access the dispatch console.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-name"
                className="text-[11px] font-semibold text-[#374559] uppercase tracking-wider"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(''); }}
                  placeholder="Sophie Okafor"
                  className={`w-full h-10 pl-9 pr-3.5 rounded-lg border text-sm text-[#0b1c30] outline-none transition-all
                    ${nameError
                      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                      : 'border-[#cbd5e1] bg-white focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20'
                    }`}
                />
              </div>
              {nameError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {nameError}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="text-[11px] font-semibold text-[#374559] uppercase tracking-wider"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  placeholder="name@company.com"
                  className={`w-full h-10 pl-9 pr-3.5 rounded-lg border text-sm text-[#0b1c30] outline-none transition-all
                    ${emailError
                      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                      : 'border-[#cbd5e1] bg-white focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20'
                    }`}
                />
              </div>
              {emailError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-password"
                className="text-[11px] font-semibold text-[#374559] uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                  className={`w-full h-10 pl-9 pr-10 rounded-lg border text-sm text-[#0b1c30] outline-none transition-all
                    ${passwordError
                      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                      : 'border-[#cbd5e1] bg-white focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#374559] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar — only shown when user is typing */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < passedCount ? strengthColor : 'bg-[#e2e8f0]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      {strength.missing.map((m) => (
                        <p key={m} className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
                          <AlertCircle className="w-3 h-3 shrink-0 text-amber-400" />
                          Missing: {m}
                        </p>
                      ))}
                      {strength.valid && (
                        <p className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          Password meets all requirements
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-bold shrink-0 ${
                        passedCount === 4
                          ? 'text-emerald-600'
                          : passedCount >= 2
                          ? 'text-amber-500'
                          : 'text-red-500'
                      }`}
                    >
                      {strengthLabel}
                    </span>
                  </div>
                </div>
              )}

              {passwordError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-confirm"
                className="text-[11px] font-semibold text-[#374559] uppercase tracking-wider"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
                <input
                  id="signup-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(''); }}
                  placeholder="Repeat password"
                  className={`w-full h-10 pl-9 pr-10 rounded-lg border text-sm text-[#0b1c30] outline-none transition-all
                    ${confirmError
                      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                      : confirmPassword && confirmPassword === password
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-[#cbd5e1] bg-white focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#374559] transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword === password && !confirmError && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Passwords match
                </p>
              )}
              {confirmError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {confirmError}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-headline font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="border-t border-[#f1f5f9] pt-4 text-center">
            <p className="text-xs text-[#64748b]">
              Already have an account?{' '}
              <button
                id="goto-login-btn"
                type="button"
                onClick={onGoToLogin}
                className="text-[#1d4ed8] font-semibold hover:underline cursor-pointer"
              >
                Log in
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#94a3b8] mt-6">
          Demo mode · Credentials stored locally in your browser
        </p>
      </div>
    </div>
  );
};
