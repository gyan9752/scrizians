'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { authApi } from '@/lib/expressApi';
import styles from './Login.module.css';

type PortalRole =
  | 'admin'
  | 'talent'
  | 'client'
  | 'contributor'
  | 'candidate';

type BackendRole =
  | 'admin'
  | 'scriza_staff'
  | 'scrizian'
  | 'client'
  | 'contributor'
  | 'candidate';

type UserData = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: BackendRole;
  scrizianId?: string;
};

const roleRouteMap: Record<string, string> = {
  admin: '/dashboard/admin',
  scriza_staff: '/dashboard/admin',
  scrizian: '/dashboard/talent',
  client: '/dashboard/client',
  contributor: '/dashboard/contributor',
  candidate: '/dashboard/candidate',
};

const frontendRoleToBackendRole: Record<PortalRole, BackendRole> = {
  admin: 'admin',
  talent: 'scrizian',
  client: 'client',
  contributor: 'contributor',
  candidate: 'candidate',
};

const getUserFromResponse = (response: any) => {
  if (response?.user) {
    return response.user;
  }

  if (response?.id && response?.role) {
    return {
      id: response.id,
      name: response.name,
      email: response.email,
      phone: response.phone,
      role: response.role,
      scrizianId: response.scrizianId,
      isVerified: response.isVerified,
      emailVerified: response.emailVerified,
      phoneVerified: response.phoneVerified,
      accountStatus: response.accountStatus,
    };
  }

  return null;
};

const getAccessTokenFromResponse = (result: any): string => {
  return (
    result?.data?.accessToken ||
    result?.accessToken ||
    ''
  );
};

export default function LoginPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] =
    useState<PortalRole>('admin');

  const isDev = process.env.NODE_ENV !== 'production';

  // Demo credentials are pre-filled in development only.
  const [email, setEmail] = useState(isDev ? 'admin@scrizians.com' : '');
  const [password, setPassword] = useState(isDev ? 'Admin@123456' : '');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // 2FA Security Modal State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [twoFactorMode, setTwoFactorMode] = useState<'static' | 'totp'>('totp');
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    qrCodeDataUrl: string;
    manualKey: string;
  } | null>(null);
  const [twoFactorSetupLoading, setTwoFactorSetupLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);

    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('session') === 'expired') {
      setErrorMessage('Your session expired. Please sign in again.');
    }
  }, []);

  /*
   * Check existing frontend auth state.
   * Auto-redirect ONLY if both user and token are present.
   */
  useEffect(() => {
    const storedUser = localStorage.getItem('scrizians_user');
    const storedToken = localStorage.getItem('scrizians_token');

    if (!storedUser || !storedToken) {
      if (storedUser && !storedToken) {
        localStorage.removeItem('scrizians_user');
      }
      return;
    }

    try {
      const user: UserData = JSON.parse(storedUser);

      if (user?.role && roleRouteMap[user.role]) {
        router.replace(roleRouteMap[user.role]);
      }
    } catch {
      localStorage.removeItem('scrizians_user');
      localStorage.removeItem('scrizians_token');
    }
  }, [router]);

  const handleRoleSelect = (role: PortalRole) => {
    setSelectedRole(role);
    setErrorMessage('');

    if (!isDev) return;

    if (role === 'admin') {
      setEmail('admin@scrizians.com');
      setPassword('Admin@123456');
    } else if (role === 'talent') {
      setEmail('talent@scrizians.com');
      setPassword('Talent@123456');
    } else if (role === 'client') {
      setEmail('client@scrizians.com');
      setPassword('Client@123456');
    } else if (role === 'contributor') {
      setEmail('contributor@scrizians.com');
      setPassword('Contributor@123456');
    } else if (role === 'candidate') {
      setEmail('candidate@scrizians.com');
      setPassword('Candidate@123456');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage('');
    setLoading(true);

    try {
      /*
       * Frontend "talent" role maps to backend "scrizian".
       */
      const backendRole =
        frontendRoleToBackendRole[selectedRole];

      const result = await authApi.login({
        email: email.trim(),
        password,
        role: backendRole,
      });

      if (!result?.success) {
        setErrorMessage(
          result?.error ||
            result?.message ||
            'Authentication failed. Please check your credentials.'
        );

        setLoading(false);
        return;
      }

      if (result?.requiresTwoFactor || result?.data?.requiresTwoFactor) {
        const challenge =
          result?.challengeToken || result?.data?.challengeToken || '';
        const needsSetup =
          result?.twoFactorSetupRequired ??
          result?.data?.twoFactorSetupRequired ??
          false;

        setLoading(false);
        setChallengeToken(challenge);
        setTwoFactorMode(
          (result?.twoFactorMode || result?.data?.twoFactorMode) === 'static'
            ? 'static'
            : 'totp'
        );
        setTwoFactorCode('');
        setTwoFactorError('');
        setTwoFactorSetup(null);
        setShow2FAModal(true);

        if (needsSetup && challenge) {
          setTwoFactorSetupLoading(true);

          const setupResult = await authApi.setup2FA(challenge);

          setTwoFactorSetupLoading(false);

          if (setupResult?.success && setupResult.qrCodeDataUrl) {
            setTwoFactorSetup({
              qrCodeDataUrl: setupResult.qrCodeDataUrl,
              manualKey: setupResult.manualKey,
            });
          } else {
            setTwoFactorError(
              setupResult?.error ||
                setupResult?.message ||
                'Could not start two-factor setup. Please try again.'
            );
          }
        }

        return;
      }

      const user = getUserFromResponse(result);
      const accessToken = getAccessTokenFromResponse(result);

      if (!user) {
        setErrorMessage(
          'Login succeeded but user information was not returned by the server.'
        );

        setLoading(false);
        return;
      }

      /*
       * Backend role is the source of truth.
       */
      const actualRole = user.role;

      if (!actualRole || !roleRouteMap[actualRole]) {
        setErrorMessage(
          'Your account role is not configured for a dashboard.'
        );

        setLoading(false);
        return;
      }

      /*
       * Optional safety check:
       * selected portal should match returned backend role.
       */
      const expectedRole = backendRole;

      if (actualRole !== expectedRole) {
        setErrorMessage(
          `This account belongs to the ${actualRole} portal. Please select the correct portal.`
        );

        await authApi.logout();
        setLoading(false);
        return;
      }

      /*
       * expressApi already stores accessToken,
       * but keeping this defensive check makes login robust.
       */
      if (accessToken) {
        localStorage.setItem(
          'scrizians_token',
          accessToken
        );
      }

      localStorage.setItem(
        'scrizians_user',
        JSON.stringify(user)
      );

      /*
       * Do NOT manually create JWT/token cookies here.
       * Refresh token is handled by the backend HTTP-only cookie.
       */
      showToast(
        `🎉 Login successful! Redirecting to ${
          user.name || 'your'
        } Portal...`
      );

      const targetRoute = roleRouteMap[actualRole];

      setTimeout(() => {
        router.push(targetRoute);
      }, 600);
    } catch (error: any) {
      console.warn('Login error:', error);

      setErrorMessage(
        error?.message ||
          'Authentication error. Please check your credentials or try again.'
      );

      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError('');
    setTwoFactorLoading(true);

    try {
      const result = await authApi.verify2FA({
        challengeToken,
        twoFactorCode: twoFactorCode.trim(),
      });

      if (!result?.success) {
        setTwoFactorError(
          result?.error ||
            result?.message ||
            'Invalid code. Please try again.'
        );
        setTwoFactorLoading(false);
        return;
      }

      const user = getUserFromResponse(result);
      const accessToken = getAccessTokenFromResponse(result);

      if (accessToken) {
        localStorage.setItem('scrizians_token', accessToken);
      }
      if (user) {
        localStorage.setItem('scrizians_user', JSON.stringify(user));
      }

      if (!user || !user.role || !roleRouteMap[user.role]) {
        setTwoFactorError('Your account role is not configured for a dashboard.');
        setTwoFactorLoading(false);
        return;
      }

      setShow2FAModal(false);
      setChallengeToken('');
      setTwoFactorSetup(null);
      setTwoFactorLoading(false);
      showToast('🎉 2FA verified successfully! Redirecting to Portal...');

      const targetRoute = roleRouteMap[user.role];
      setTimeout(() => {
        router.push(targetRoute);
      }, 600);
    } catch (err: any) {
      setTwoFactorError(err?.message || 'Failed to verify 2FA code.');
      setTwoFactorLoading(false);
    }
  };

  const handleOpenForgotModal = () => {
    setForgotEmail(email || '');
    setOtpSent(false);
    setOtpCode('');
    setNewPassword('');
    setShowForgotModal(true);
  };

  /*
   * Password-reset backend flow is not currently implemented
   * in the Express auth routes, so do not fake OTP success.
   */
  const handleSendResetCode = (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage(
      'Password reset is not available yet. Please contact the administrator.'
    );
  };

  const handleResetPasswordSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setForgotLoading(false);

    showToast(
      'Password reset is not available yet. Please contact the administrator.'
    );
  };

  return (
    <>
      <Header />

      {/* Top Right Toast Notification */}
      {toastMsg && (
        <div className={styles.toastContainer}>
          <div className={styles.toastCard}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      <main className={styles.loginSection}>
        <div className={styles.cardWrapper}>
          {/* Left Dark Navy Card */}
          <div className={styles.leftPanel}>
            <div className={styles.leftTop}>
              <Link href="/" className={styles.brand}>
                <div className={styles.logoBadge}>
                  <img
                    src="/images/logo-white.png"
                    alt="Scrizians Logo"
                    className={styles.logoImg}
                  />
                </div>
              </Link>

              <h1 className={styles.headline}>
                Welcome back to Scrizians
              </h1>

              <p className={styles.leftSub}>
                Sign in to access your admin operations,
                talent network profile, client portal, or
                candidate workspace.
              </p>
            </div>

            <Link href="/" className={styles.backLink}>
              ← Back to website
            </Link>
          </div>

          {/* Right White Form Panel */}
          <div className={styles.rightPanel}>
            <h2 className={styles.formTitle}>
              Portal Authentication
            </h2>

            <p className={styles.formSub}>
              Select your portal role and enter credentials
              to sign in.
            </p>

            {errorMessage && (
              <div className={styles.errorAlert}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Portal / Role Dropdown */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Select Portal / Role *
                </label>

                <select
                  value={selectedRole}
                  onChange={(e) =>
                    handleRoleSelect(
                      e.target.value as PortalRole
                    )
                  }
                  className={styles.selectInput}
                  style={{
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  <option value="admin">
                    👑 Admin & Operations Portal
                  </option>

                  <option value="talent">
                    💻 Scrizian Talent Portal
                  </option>

                  <option value="client">
                    🏢 Client & Company Portal
                  </option>

                  <option value="contributor">
                    ✍️ Content Contributor Portal
                  </option>

                  <option value="candidate">
                    📄 Job Candidate Portal
                  </option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Email Address *
                </label>

                <input
                  type="email"
                  required
                  className={styles.input}
                  placeholder="aarav@company.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.label}>
                    Password *
                  </label>

                  <button
                    type="button"
                    className={styles.forgotBtn}
                    onClick={handleOpenForgotModal}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className={styles.passwordWrapper}>
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    required
                    className={styles.passwordInput}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                  />

                  <button
                    type="button"
                    className={
                      styles.eyeToggleBtn
                    }
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    title={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={loading}
              >
                {loading
                  ? 'Authenticating...'
                  : `Log In to ${selectedRole.toUpperCase()} Portal →`}
              </button>

              <p className={styles.footerNote}>
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className={styles.linkRed}
                >
                  Create account
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            setShowForgotModal(false)
          }
        >
          <div
            className={styles.modalContent}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className={styles.modalCloseBtn}
              onClick={() =>
                setShowForgotModal(false)
              }
              title="Close modal"
            >
              ×
            </button>

            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                🔑 Reset Your Password
              </h3>

              <p className={styles.modalSub}>
                {!otpSent
                  ? 'Enter your registered email address to receive a secure password reset verification code.'
                  : `Enter the 6-digit code sent to ${forgotEmail} and choose a new password.`}
              </p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendResetCode}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Registered Email Address *
                  </label>

                  <input
                    type="email"
                    required
                    className={styles.input}
                    placeholder="name@scrizians.com"
                    value={forgotEmail}
                    onChange={(e) =>
                      setForgotEmail(
                        e.target.value
                      )
                    }
                  />
                </div>

                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={forgotLoading}
                >
                  {forgotLoading
                    ? 'Sending Code...'
                    : 'Send Verification Code →'}
                </button>
              </form>
            ) : (
              <form
                onSubmit={
                  handleResetPasswordSubmit
                }
              >
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Verification Code (OTP) *
                  </label>

                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g. 784920"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    New Password *
                  </label>

                  <div
                    className={
                      styles.passwordWrapper
                    }
                  >
                    <input
                      type={
                        showNewPassword
                          ? 'text'
                          : 'password'
                      }
                      required
                      className={
                        styles.passwordInput
                      }
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(
                          e.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className={
                        styles.eyeToggleBtn
                      }
                      onClick={() =>
                        setShowNewPassword(
                          !showNewPassword
                        )
                      }
                    >
                      {showNewPassword
                        ? '👁️'
                        : '🔒'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={forgotLoading}
                >
                  {forgotLoading
                    ? 'Updating Password...'
                    : 'Reset & Update Password →'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2FA Security Modal */}
      {show2FAModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShow2FAModal(false)}
        >
          <div
            className={`${styles.modalContent} ${styles.twoFactorModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalCloseBtn}
              onClick={() => setShow2FAModal(false)}
              title="Close modal"
            >
              ×
            </button>

            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {twoFactorSetup || twoFactorSetupLoading
                  ? '🛡️ Set up Two-Factor Authentication'
                  : '🛡️ Two-Factor Verification'}
              </h3>
              <p className={styles.modalSub}>
                {twoFactorSetup || twoFactorSetupLoading
                  ? 'Scan the QR code with Google Authenticator, Microsoft Authenticator or Authy, then enter the 6-digit code it shows.'
                  : twoFactorMode === 'static'
                  ? <>Enter the 6-digit security OTP for <strong>{email}</strong>.</>
                  : <>Enter the 6-digit code from your authenticator app for <strong>{email}</strong>.</>}
              </p>
            </div>

            {twoFactorError && (
              <div className={`${styles.errorAlert} ${styles.twoFactorError}`}>
                {twoFactorError}
              </div>
            )}

            {twoFactorSetupLoading && (
              <p className={styles.twoFactorHint}>Generating your QR code...</p>
            )}

            {twoFactorSetup && (
              <div className={styles.qrBox}>
                <img
                  src={twoFactorSetup.qrCodeDataUrl}
                  alt="Scan this QR code with your authenticator app"
                  className={styles.qrImage}
                  width={220}
                  height={220}
                />
                <p className={styles.twoFactorHint}>
                  Can't scan? Enter this key manually:
                </p>
                <code className={styles.manualKey}>{twoFactorSetup.manualKey}</code>
              </div>
            )}

            <form onSubmit={handle2FASubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {twoFactorMode === 'static' ? '6-Digit Security OTP *' : '6-Digit Authenticator Code *'}
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  className={`${styles.input} ${styles.otpInput}`}
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) =>
                    setTwoFactorCode(e.target.value.replace(/\D/g, ''))
                  }
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={
                  twoFactorLoading ||
                  twoFactorSetupLoading ||
                  twoFactorCode.length !== 6
                }
              >
                {twoFactorLoading
                  ? 'Verifying...'
                  : twoFactorSetup
                  ? 'Confirm & Enable 2FA →'
                  : 'Verify & Sign In →'}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}