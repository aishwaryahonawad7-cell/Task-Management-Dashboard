
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import "./LoginForm.css";

const LoginForm = () => {
  const { login, isLoading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim();

    // Validate empty fields
    if (!trimmedEmail || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await login(trimmedEmail, password);

      // Redirect to the originally requested page
      const from = location.state?.from?.pathname || "/dashboard";

      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again."
      );
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">

        <div className="login-brand">
          <div className="login-logo">S</div>
          <h1>SupportDesk</h1>
          <p>Customer Support Management</p>
        </div>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>Sign in to continue to your workspace.</p>
        </div>

        {/* noValidate allows React to handle form validation */}
        <form onSubmit={handleSubmit} noValidate>

          <div className="login-field">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              autoComplete="username"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

        </form>

        <p className="login-footer">
          Secure access to your support workspace.
        </p>

      </section>
    </main>
  );
};

export default LoginForm;
