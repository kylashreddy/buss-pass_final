import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function RegisterForm({ onSwitchToLogin }) {
  const [fullName, setFullName] = useState("");
  const [usn, setUsn] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // ✅ Check for duplicate USN or Email in Firestore
      const usersRef = collection(db, "users");
      const usnQuery = query(usersRef, where("usn", "==", usn));
      const emailQuery = query(usersRef, where("email", "==", email));

      const [usnSnapshot, emailSnapshot] = await Promise.all([
        getDocs(usnQuery),
        getDocs(emailQuery),
      ]);

      if (!usnSnapshot.empty) {
        throw new Error("USN already exists. Please use a different one.");
      }
      if (!emailSnapshot.empty) {
        throw new Error("Email already exists. Please use a different one.");
      }

      // ✅ Create new Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Save extra user info to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        usn,
        email,
      });

      // ✅ Navigate after successful registration
      navigate("/home");

      // Clear fields
      setFullName("");
      setUsn("");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Registration Error:", err);
      setError(err.message);
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
        Register
      </h2>

      <form onSubmit={handleRegister}>
        {/* Full Name */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </div>

        {/* USN */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
            USN
          </label>
          <input
            type="text"
            placeholder="Enter your USN"
            value={usn}
            onChange={(e) => setUsn(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
            Email-ID
          </label>
          <input
            type="email"
            placeholder="e.g. user@jainuniversity.ac.in"
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

        {/* Password */}
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

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#fef7f0",
              border: "1px solid #f9c9c9",
              color: "#d93025",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {/* Register Button */}
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
          {isLoading ? "Registering..." : "Register"}
        </motion.button>
      </form>

      
    </motion.div>
  );
}

export default RegisterForm;
