import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Code2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { getAuthRedirectUrl } from './supabase.js';

const viewContent = {
  'sign-in': {
    eyebrow: 'WELCOME BACK',
    title: 'Sign in to CampusTwin',
    description: 'Use your email and password to continue to the student portal.',
    button: 'Sign in',
  },
  'sign-up': {
    eyebrow: 'CREATE YOUR ACCOUNT',
    title: 'Join CampusTwin',
    description: 'Create an account with your email. We’ll ask you to confirm it before signing in.',
    button: 'Create account',
  },
  reset: {
    eyebrow: 'ACCOUNT RECOVERY',
    title: 'Reset your password',
    description: 'We’ll send a password-reset link to the email address on your account.',
    button: 'Send reset link',
  },
  recovery: {
    eyebrow: 'CHOOSE A NEW PASSWORD',
    title: 'Set a new password',
    description: 'Choose a new password for your CampusTwin account.',
    button: 'Update password',
  },
};

function getErrorMessage(error) {
  const message = error?.message || 'Something went wrong. Please try again.';
  if (/invalid login credentials/i.test(message)) return 'That email and password combination was not recognized.';
  if (/user already registered/i.test(message)) return 'An account already exists for this email. Try signing in instead.';
  if (/email not confirmed/i.test(message)) return 'Confirm your email from the link we sent, then sign in.';
  if (/password should be at least/i.test(message)) return 'Use a password with at least 8 characters.';
  return message;
}

export default function AuthScreen({ client, isPasswordRecovery = false, onPasswordUpdated, onStartDeveloperMode }) {
  const [mode, setMode] = useState(isPasswordRecovery ? 'recovery' : 'sign-in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('recovery');
      setFeedback(null);
    }
  }, [isPasswordRecovery]);

  const content = viewContent[mode];
  const isSignUp = mode === 'sign-up';
  const isPasswordEntry = mode === 'sign-in' || isSignUp || mode === 'recovery';

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setFeedback(null);

    const normalizedEmail = email.trim().toLowerCase();
    if ((isSignUp || mode === 'recovery') && password.length < 8) {
      setFeedback({ type: 'error', text: 'Use a password with at least 8 characters.' });
      return;
    }
    if (isSignUp && !fullName.trim()) {
      setFeedback({ type: 'error', text: 'Enter the name you want shown on your account.' });
      return;
    }
    if (mode === 'recovery' && password !== confirmPassword) {
      setFeedback({ type: 'error', text: 'The passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'sign-in') {
        const { error } = await client.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
        return;
      }

      if (mode === 'sign-up') {
        const { data, error } = await client.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { name: fullName.trim(), app: 'campustwin' },
            emailRedirectTo: getAuthRedirectUrl(),
          },
        });
        if (error) throw error;
        if (!data.session) {
          setFeedback({ type: 'success', text: 'Check your inbox for a confirmation link. Confirm your email, then return here to sign in.' });
        }
        return;
      }

      if (mode === 'reset') {
        const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: getAuthRedirectUrl() });
        if (error) throw error;
        setFeedback({ type: 'success', text: 'If an account exists for that email, a password-reset link is on its way.' });
        return;
      }

      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      await client.auth.signOut();
      onPasswordUpdated?.();
      setPassword('');
      setConfirmPassword('');
      setMode('sign-in');
      setFeedback({ type: 'success', text: 'Password updated. Sign in with your new password.' });
    } catch (error) {
      setFeedback({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-atmosphere auth-atmosphere-one" aria-hidden="true" />
      <div className="auth-atmosphere auth-atmosphere-two" aria-hidden="true" />
      <div className="auth-layout">
        <section className="auth-brand-panel" aria-label="About CampusTwin">
          <a className="auth-brand-lockup" href={getAuthRedirectUrl()} aria-label="CampusTwin home">
            <span className="auth-brand-mark"><span /></span>
            <span className="auth-brand-wordmark">campus<span>twin</span></span>
          </a>
          <div className="auth-brand-copy">
            <span className="auth-brand-kicker"><span /> THE STUDENT PORTAL</span>
            <h1>Campus life,<br /><em>in one place.</em></h1>
            <p>Events, student groups, useful campus contacts, and class updates—together in one calm, easy-to-use space.</p>
          </div>
          <div className="auth-brand-foot"><ShieldCheck size={15} /> Built for the campus community</div>
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-kicker">{content.eyebrow}</div>
          <h2 id="auth-title">{content.title}</h2>
          <p className="auth-card-description">{content.description}</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignUp && (
              <label className="auth-field">
                <span>YOUR NAME</span>
                <span className="auth-input-wrap"><UserRound size={16} /><input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="e.g. Aanya Rao" maxLength={120} required /></span>
              </label>
            )}
            {mode !== 'recovery' && (
              <label className="auth-field">
                <span>EMAIL ADDRESS</span>
                <span className="auth-input-wrap"><Mail size={16} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.edu" required /></span>
              </label>
            )}
            {isPasswordEntry && (
              <label className="auth-field">
                <span>PASSWORD {isSignUp || mode === 'recovery' ? '· 8+ CHARACTERS' : ''}</span>
                <span className="auth-input-wrap"><LockKeyhole size={16} /><input type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={isSignUp || mode === 'recovery' ? 8 : undefined} required /></span>
              </label>
            )}
            {mode === 'recovery' && (
              <label className="auth-field">
                <span>CONFIRM NEW PASSWORD</span>
                <span className="auth-input-wrap"><LockKeyhole size={16} /><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required /></span>
              </label>
            )}

            {feedback && <p className={`auth-feedback auth-feedback-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.type === 'success' && <CheckCircle2 size={15} />}{feedback.text}</p>}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait…' : content.button}
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          {mode === 'sign-in' && (
            <div className="auth-form-links">
              <button type="button" onClick={() => changeMode('reset')}>Forgot password?</button>
              <span>New here? <button type="button" onClick={() => changeMode('sign-up')}>Create an account</button></span>
            </div>
          )}
          {mode === 'sign-up' && <p className="auth-switch-copy">Already have an account? <button type="button" onClick={() => changeMode('sign-in')}>Sign in</button></p>}
          {mode === 'reset' && <p className="auth-switch-copy">Remembered it? <button type="button" onClick={() => changeMode('sign-in')}>Back to sign in</button></p>}
          {mode === 'recovery' && !isPasswordRecovery && <p className="auth-switch-copy"><button type="button" onClick={() => changeMode('sign-in')}>Back to sign in</button></p>}

          {onStartDeveloperMode && !isPasswordRecovery && (
            <section className="auth-dev-panel" aria-labelledby="auth-dev-title">
              <div className="auth-dev-heading">
                <span className="auth-dev-icon"><Code2 size={16} /></span>
                <span><strong id="auth-dev-title">Developer preview</strong><small>LOCAL ONLY · NO ACCOUNT REQUIRED</small></span>
              </div>
              <p>Explore every current prototype control as CampusTwin Developer. No Supabase account or session is created; preview changes stay in this browser. “Start from start” in the preview returns to Dashboard and keeps saved browser data.</p>
              <div className="auth-dev-actions">
                <button type="button" onClick={onStartDeveloperMode}>Start Developer Mode <ArrowRight size={15} /></button>
              </div>
            </section>
          )}

          <aside className="auth-shared-account-note">
            <ShieldCheck size={15} />
            <span>CampusTwin uses the existing OS-GOD Supabase account system. Use your existing login or create a shared account; campus demo activity remains only in this browser.</span>
          </aside>
        </section>
      </div>
      <footer className="auth-footer">CAMPUS TWIN <span /> SECURE SIGN-IN POWERED BY SUPABASE</footer>
    </main>
  );
}
