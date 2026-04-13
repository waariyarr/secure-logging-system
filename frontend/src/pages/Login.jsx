import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser, registerUser } from "../services/api";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";

const MIN_USER = 3;
const MIN_PASS = 6;

function validate(form, isLogin) {
  const errors = {};
  if (!form.username?.trim()) {
    errors.username = "Username is required.";
  } else if (form.username.trim().length < MIN_USER) {
    errors.username = `At least ${MIN_USER} characters.`;
  }
  if (!form.password) {
    errors.password = "Password is required.";
  } else if (!isLogin && form.password.length < MIN_PASS) {
    errors.password = `At least ${MIN_PASS} characters for registration.`;
  }
  return errors;
}

export default function Login({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate(formData, isLogin);
    setErrors(v);
    if (Object.keys(v).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const response = isLogin
        ? await loginUser(formData)
        : await registerUser(formData);

      const token = response.data?.token;
      const user = response.data?.user;
      if (!token || !user) {
        toast.error("Unexpected response from server.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onAuthSuccess?.(user);
      toast.success(isLogin ? "Signed in." : "Account created.");
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Could not complete the request.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{isLogin ? "Sign in" : "Create account"}</h1>
        <p className="login-card__sub">
          Wallet-grade logging UI — JWT session after classic login.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            autoComplete="username"
            placeholder="your_handle"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="••••••••"
            disabled={submitting}
          />

          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {isLogin ? "Sign in" : "Register"}
          </Button>
        </form>

        <p className="page-sub" style={{ textAlign: "center", marginTop: "1.25rem" }}>
          <button
            type="button"
            className="btn btn--ghost"
            style={{ width: "100%" }}
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
            }}
          >
            {isLogin
              ? "Need an account? Register"
              : "Already registered? Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
