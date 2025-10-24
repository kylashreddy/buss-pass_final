import React, { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { logLoginEvent } from "../utils/logLoginEvent";

function LoginForm({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let profile = null;
      let role = null;
      if (userDocSnap.exists()) {
        profile = userDocSnap.data();
        role = profile.role;

        // Cache user profile to localStorage
        try {
          localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profile));
        } catch (e) {
          console.warn("Failed to cache user profile:", e);
        }
      }

      // Log login event
      logLoginEvent(db, user, profile).catch((e) => console.warn("logLoginEvent failed:", e));

      // Route by role
      if (role === "student") {
        navigate("/epass");
      } else if (role === "teacher") {
        navigate("/home");
      } else if (role === "admin") {
        navigate("/admin/requests");
      } else {
        navigate("/home");
      }

      setEmail("");
      setPassword("");
    } catch (err) {
      // ✅ Friendly error messages
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("invalid-credentials");
      } else if (err.code === "auth/user-not-found") {
        setError("user-not-found");
      } else if (err.code === "auth/invalid-email") {
        setError("invalid-email");
      } else {
        setError("unknown-error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -2 }}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        borderRadius: "16px",
        padding: "32px",
        backdropFilter: "blur(10px)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "420px",
      }}
    >
      <h2 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "20px", color: "#111" }}>
        Login
      </h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
            Email-ID
          </label>
          <input
            type="text"
            placeholder="e.g. user@jainuniversity.ac.in "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </div>

        {/* ⚠️ Clean Error Box */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#fff5f5",
              border: "1px solid #fca5a5",
              color: "#b91c1c",
              padding: "12px 14px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "500",
              marginBottom: "18px",
              boxShadow: "0 2px 8px rgba(255, 0, 0, 0.05)",
            }}
          >
            {" "}
            <span>
              {error === "invalid-credentials"
                ? "Invalid credentials. Try again."
                : error === "user-not-found"
                ? "No account found with this email."
                : error === "invalid-email"
                ? "Invalid email format."
                : "Something went wrong. Please try again."}
            </span>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          whileTap={{ scale: isLoading ? 1 : 0.99 }}
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "#2563EB",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Signing in..." : "Login"}
        </motion.button>
      </form>
    </motion.div>
  );
}

export default LoginForm;
