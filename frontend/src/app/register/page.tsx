'use client';

import React, {
  useState,
  useEffect,
  Suspense,
} from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { authApi } from '@/lib/expressApi';
import styles from './Register.module.css';

type RegisterRole =
  | 'talent'
  | 'candidate'
  | 'contributor'
  | 'client';

type BackendRole =
  | 'scrizian'
  | 'candidate'
  | 'contributor'
  | 'client';

type UserData = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: BackendRole;
  scrizianId?: string;
  avatar?: string;
  avatarUrl?: string;
  title?: string;
};

const roleRouteMap: Record<BackendRole, string> = {
  scrizian: '/dashboard/talent',
  candidate: '/dashboard/candidate',
  contributor: '/dashboard/contributor',
  client: '/dashboard/client',
};

const frontendRoleToBackendRole: Record<
  RegisterRole,
  BackendRole
> = {
  talent: 'scrizian',
  candidate: 'candidate',
  contributor: 'contributor',
  client: 'client',
};

const getUserFromResponse = (
  result: any
): UserData | null => {
  return (
    result?.data?.user ||
    result?.data ||
    result?.user ||
    null
  );
};

const getAccessTokenFromResponse = (
  result: any
): string => {
  return (
    result?.data?.accessToken ||
    result?.accessToken ||
    ''
  );
};

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roleParam = searchParams.get('role');

  const [selectedRole, setSelectedRole] =
    useState<RegisterRole>('contributor');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [agreeTerms, setAgreeTerms] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [toastMsg, setToastMsg] =
    useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);

    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  useEffect(() => {
    if (
      roleParam === 'contributor' ||
      roleParam === 'talent' ||
      roleParam === 'candidate' ||
      roleParam === 'client'
    ) {
      setSelectedRole(roleParam);
    }
  }, [roleParam]);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrorMessage('');

    if (fullName.trim().length < 2) {
      setErrorMessage(
        'Please enter your full name.'
      );
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        'Password must be at least 8 characters long.'
      );
      return;
    }

    if (!agreeTerms) {
      setErrorMessage(
        'Please accept the Terms of Use and Privacy Policy to proceed.'
      );
      return;
    }

    setLoading(true);

    try {
      const backendRole =
        frontendRoleToBackendRole[selectedRole];

      const result = await authApi.register({
        name: fullName.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: backendRole,
      });

      if (!result?.success) {
        setErrorMessage(
          result?.error ||
            result?.message ||
            'Failed to create account. Please try again.'
        );

        setLoading(false);
        return;
      }

      const user =
        getUserFromResponse(result);

      const accessToken =
        getAccessTokenFromResponse(result);

      if (!user) {
        setErrorMessage(
          'Account was created but user information was not returned by the server.'
        );

        setLoading(false);
        return;
      }

      const actualRole = user.role;

      if (
        !actualRole ||
        !roleRouteMap[actualRole]
      ) {
        setErrorMessage(
          'Account created, but your role is not configured for a dashboard.'
        );

        setLoading(false);
        return;
      }

      if (actualRole !== backendRole) {
        setErrorMessage(
          'The registered account role does not match the selected portal.'
        );

        setLoading(false);
        return;
      }

      /*
       * expressApi already stores the access token.
       * This is only a defensive fallback.
       */
      if (accessToken) {
        localStorage.setItem(
          'scrizians_token',
          accessToken
        );
      }

      const userWithAvatar = {
        ...user,
        avatar: avatarUrl || user.avatar || '/images/logo.png',
        avatarUrl: avatarUrl || user.avatarUrl || '/images/logo.png'
      };

      localStorage.setItem(
        'scrizians_user',
        JSON.stringify(userWithAvatar)
      );

      showToast(
        '🎉 Account registered successfully!'
      );

      const targetRoute =
        roleRouteMap[actualRole];

      setTimeout(() => {
        router.push(targetRoute);
      }, 800);
    } catch (error: any) {
      console.warn(
        'Express Register Error:',
        error
      );

      setErrorMessage(
        error?.message ||
          'Unable to create your account. Please try again.'
      );

      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      {/* Top Right Toast Notification */}
      {toastMsg && (
        <div className={styles.toastContainer}>
          <div className={styles.toastCard}>
            <span
              style={{ fontSize: '1.1rem' }}
            >
              🎉
            </span>

            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      <main className={styles.registerSection}>
        <div className={styles.cardWrapper}>
          {/* Left Dark Navy Card */}
          <div className={styles.leftPanel}>
            <div className={styles.leftTop}>
              <Link
                href="/"
                className={styles.brand}
              >
                <div
                  className={styles.logoBadge}
                >
                  <img
                    src="/images/logo-white.png"
                    alt="Scrizians Logo"
                    className={
                      styles.logoImg
                    }
                  />
                </div>
              </Link>

              <h1
                className={styles.headline}
              >
                Talent. Technology. Together.
              </h1>

              <p
                className={styles.leftSub}
              >
                One secure account for
                Scrizians, candidates,
                contributors and clients —
                with role-based dashboards.
              </p>
            </div>

            <Link
              href="/"
              className={styles.backLink}
            >
              ← Back to website
            </Link>
          </div>

          {/* Right White Form Panel */}
          <div className={styles.rightPanel}>
            <h2
              className={styles.formTitle}
            >
              Create your account
            </h2>

            <p
              className={styles.formSub}
            >
              Choose how you want to use
              Scrizians.
            </p>

            {errorMessage && (
              <div
                className={
                  styles.errorAlert
                }
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Role Selector Grid */}
              <div className={styles.roleGrid}>
                <div
                  className={`${styles.roleCard} ${
                    selectedRole === 'talent'
                      ? styles.roleCardSelected
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedRole('talent');
                    setErrorMessage('');
                  }}
                >
                  <span
                    className={
                      styles.roleCardTitle
                    }
                  >
                    Scrizian (Talent)
                  </span>

                  <span
                    className={
                      styles.roleCardDesc
                    }
                  >
                    Get listed on Talent
                    Network
                  </span>
                </div>

                <div
                  className={`${styles.roleCard} ${
                    selectedRole ===
                    'candidate'
                      ? styles.roleCardSelected
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedRole(
                      'candidate'
                    );
                    setErrorMessage('');
                  }}
                >
                  <span
                    className={
                      styles.roleCardTitle
                    }
                  >
                    Job Candidate
                  </span>

                  <span
                    className={
                      styles.roleCardDesc
                    }
                  >
                    Apply & track job
                    applications
                  </span>
                </div>

                <div
                  className={`${styles.roleCard} ${
                    selectedRole ===
                    'contributor'
                      ? styles.roleCardSelected
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedRole(
                      'contributor'
                    );
                    setErrorMessage('');
                  }}
                >
                  <span
                    className={
                      styles.roleCardTitle
                    }
                  >
                    Contributor
                  </span>

                  <span
                    className={
                      styles.roleCardDesc
                    }
                  >
                    Write articles for
                    Insights
                  </span>
                </div>

                <div
                  className={`${styles.roleCard} ${
                    selectedRole === 'client'
                      ? styles.roleCardSelected
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedRole('client');
                    setErrorMessage('');
                  }}
                >
                  <span
                    className={
                      styles.roleCardTitle
                    }
                  >
                    Client / Company
                  </span>

                  <span
                    className={
                      styles.roleCardDesc
                    }
                  >
                    Hire talent & manage
                    requirements
                  </span>
                </div>
              </div>

              {/* Input Fields */}
              {/* Profile Avatar Upload Field */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', padding: '0.8rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: avatarUrl ? `url(${avatarUrl}) center/cover no-repeat` : '#E2E8F0',
                  border: '2px solid #E52B2B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  color: '#64748B',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {!avatarUrl && '👤'}
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.2rem' }}>
                    Profile Photo (Optional)
                  </label>
                  <label style={{
                    display: 'inline-block',
                    background: '#0B172A',
                    color: '#ffffff',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}>
                    📷 Choose Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setAvatarUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {avatarUrl && (
                    <button 
                      type="button" 
                      onClick={() => setAvatarUrl('')} 
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginLeft: '0.5rem' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label
                  className={styles.label}
                >
                  Full name *
                </label>

                <input
                  type="text"
                  required
                  className={styles.input}
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label
                  className={styles.label}
                >
                  Email *
                </label>

                <input
                  type="email"
                  required
                  className={styles.input}
                  placeholder="aarav@company.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label
                  className={styles.label}
                >
                  Password *
                </label>

                <div
                  className={
                    styles.passwordWrapper
                  }
                >
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    required
                    className={
                      styles.passwordInput
                    }
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) =>
                      setPassword(
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
                    {showPassword
                      ? '👁️'
                      : '🔒'}
                  </button>
                </div>

                <span
                  className={
                    styles.helpText
                  }
                >
                  Minimum 8 characters
                </span>
              </div>

              <div
                className={
                  styles.checkboxRow
                }
              >
                <input
                  type="checkbox"
                  required
                  id="termsCheck"
                  className={
                    styles.checkbox
                  }
                  checked={agreeTerms}
                  onChange={(e) =>
                    setAgreeTerms(
                      e.target.checked
                    )
                  }
                />

                <label
                  htmlFor="termsCheck"
                  style={{
                    cursor: 'pointer',
                  }}
                >
                  I accept Terms of Use,
                  Privacy Policy and
                  role-specific terms.
                </label>
              </div>

              <button
                type="submit"
                className={
                  styles.btnSubmit
                }
                disabled={loading}
              >
                {loading
                  ? 'Creating account...'
                  : 'Create account'}
              </button>

              <p
                className={
                  styles.footerNote
                }
              >
                Already have an account?{' '}
                <Link
                  href="/login"
                  className={
                    styles.linkRed
                  }
                >
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: '4rem',
            textAlign: 'center',
          }}
        >
          Loading registration...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}