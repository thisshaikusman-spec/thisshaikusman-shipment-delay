import React, { useState } from 'react';
import {
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
  findUser,
  createSession,
  StoredUser,
} from '../auth';

interface LoginScreenProps {
  onLoginSuccess: (user: StoredUser) => void;
  onGoToSignUp: () => void;
  successMessage?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGoToSignUp,
  successMessage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState('');
  const [credentialError, setCredentialError] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const clearErrors = () => {
    setEmailError('');
    setCredentialError('');
    setForgotMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    let hasError = false;

    if (!email.trim() || !isValidEmail(email)) {
      setEmailError('Enter a valid email');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    // Simulate a brief network delay for realism
    await new Promise((r) => setTimeout(r, 600));

    const user = findUser(email.trim());

    if (!user || user.password !== password) {
      setCredentialError('Invalid email or password');
      setLoading(false);
      return;
    }

    createSession(user);
    setLoading(false);
    onLoginSuccess(user);
  };

  const handleForgotPassword = () => {
    setForgotMsg(
      'Password reset is not available in this demo. Use the credentials you signed up with.'
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center px-4">
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
          <span className="text-xs font-medium text-[#64748b] tracking-wider uppercase px-3 py-1 bg-[#d3e4fe] text-[#374559] rounded">
            Ops Dispatch Console
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-[#e2e8f0] p-7 space-y-5">
          <div className="space-y-1">
            <h1 className="font-headline font-bold text-xl text-[#0b1c30]">
              Sign in to your account
            </h1>
            <p className="text-xs text-[#64748b]">
              Access the real-time shipment delay prediction console.
            </p>
          </div>

          {/* Post-signup success message */}
          {successMessage && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-[11px] font-semibold text-[#374559] uppercase tracking-wider"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearErrors(); }}
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
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-[11px] font-semibold text-[#374559] uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-[#1d4ed8] hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
                  placeholder="Your password"
                  className="w-full h-10 pl-9 pr-10 rounded-lg border border-[#cbd5e1] bg-white text-sm text-[#0b1c30] outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#374559] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Credential error */}
            {credentialError && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{credentialError}</span>
              </div>
            )}

            {/* Forgot password message */}
            {forgotMsg && (
              <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotMsg}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-headline font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="border-t border-[#f1f5f9] pt-4 text-center">
            <p className="text-xs text-[#64748b]">
              Don't have an account?{' '}
              <button
                id="goto-signup-btn"
                type="button"
                onClick={onGoToSignUp}
                className="text-[#1d4ed8] font-semibold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-[#94a3b8] mt-6">
          Demo mode · Credentials stored locally in your browser
        </p>
      </div>
    </div>
  );
};
