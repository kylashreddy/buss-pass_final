import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { logLoginEvent } from "./utils/logLoginEvent";
import { motion } from 'framer-motion';

// Components
import TrackingPlaceholder from './components/TrackingPlaceholder';
import Home from './components/Home';
import SignUpForm from './components/SignUpForm';
import LoginForm from './components/LoginForm';
import BusPassRequestForm from './components/BusPassRequestForm';
import AdminDashboard from './components/AdminDashboard';
import AdminComplaints from './components/AdminComplaints';
import StudentBusPassView from './components/StudentBusPassView';
import Navbar from "./components/Navbar";
import ContactUs from './components/ContactUs';
import AdminUsersTable from './components/AdminUsersTableClean';
import AllData from './components/AllData'; 
import AdminNotifications from './components/AdminNotifications';
import UserNotifications from './components/UserNotifications';
import PassVerification from './components/PassVerification';

// Helper to safely convert Firestore Timestamp to Date
const toDate = (v) => {
  if (!v) return null;
  if (typeof v.toDate === "function") return v.toDate();
  return v instanceof Date ? v : null;
};

// Component to wrap page content with animation
const PageWrapper = ({ children }) => (
  <motion.div
    className="page-content"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// Component for Auth Page (Login/Register)
const AuthPage = ({ showRegister, setShowRegister }) => (
  <motion.div className="auth-container" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
    <div className="auth-left">
      <img src="/logo.png" alt="Bus" />
      <h2>CampusBus Login</h2>
      <p>Access bus e-pass, tracking, and payments with your university credentials.</p>
    </div>

    <div className="card">
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <img src="/logo.png" alt="CampusBus Logo" style={{ width: "50px", height: "50px", marginRight: "12px", borderRadius: "50%" }} />
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>CampusBus Portal</h1>
          <p style={{ fontSize: "12px", color: "#555", margin: 0 }}>Student • Teacher</p>
        </div>
      </div>

      {showRegister ? <SignUpForm /> : <LoginForm />}

      <p style={{ marginTop: "20px" }}>
        {showRegister ? (
          <>Already registered?{' '}
            <span onClick={() => setShowRegister(false)} style={{ color: "#3B82F6", cursor: "pointer", fontWeight: "bold" }}>Login here</span>
          </>
        ) : (
          <>Not registered yet?{' '}
            <span onClick={() => setShowRegister(true)} style={{ color: "#3B82F6", cursor: "pointer", fontWeight: "bold" }}>Register here</span>
          </>
        )}
      </p>
    </div>
  </motion.div>
);


function App() {
  // PWA install prompt handling
  const [deferredPrompt, setDeferredPrompt] = useState(null);


  useEffect(() => {
    const handler = (e) => {
      // Prevent the automatic prompt
      e.preventDefault();
      // Save the event for later use
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      // store that user saw it so we don't nag them
      localStorage.setItem('seenInstallPrompt', '1');
      setDeferredPrompt(null);
      console.log('User response to the install prompt:', choiceResult);
    } catch (err) {
      console.error('Install prompt error', err);
    }
  };

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApprovedPass, setHasApprovedPass] = useState(false);
  const [showRegister, setShowRegister] = useState(false); 

  // --- PASS CHECK LOGIC (Moved outside useEffect for readability) ---
  const checkApprovedPass = async (uid) => {
    if (!uid) {
        setHasApprovedPass(false);
        return;
    }
    
    const routeCollections = [
      "busPassRequests", 
      ...Array.from({ length: 12 }, (_, i) => `route-${i + 1}`)
    ];

    let isAnyValid = false;
    const now = new Date();

    const queries = routeCollections.map(col => 
      getDocs(query(
        collection(db, col),
        where("studentId", "==", uid),
        where("status", "==", "approved")
      ))
    );

    const snapshots = await Promise.all(queries);

    for (const snapshot of snapshots) {
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const approvedAt = toDate(data.approvedAt) || toDate(data.requestDate);
        const validUntil = toDate(data.validUntil) || 
                           (approvedAt ? new Date(approvedAt.getTime() + 365 * 24 * 60 * 60 * 1000) : null);
        
        if (validUntil && validUntil > now) {
          isAnyValid = true;
          break;
        }
      }
      if (isAnyValid) break; 
    }

    setHasApprovedPass(isAnyValid);
  };
  // -------------------------


  useEffect(() => {
    document.body.style.backgroundColor = "#F9FAFB";
    document.documentElement.style.backgroundColor = "#F9FAFB";

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);

        try {
          // Try to use cached profile first (set during login for instant load)
          let profile = null;
          const cacheKey = `userProfile_${currentUser.uid}`;
          const cachedProfile = localStorage.getItem(cacheKey);
          
          if (cachedProfile) {
            try {
              profile = JSON.parse(cachedProfile);
            } catch (e) {
              console.warn('Failed to parse cached profile:', e);
            }
          }
          
          // If no cache, fetch from Firestore (fallback for page refresh or other auth changes)
          if (!profile) {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              profile = userDocSnap.data();
            }
          }

          if (profile) {
            const role = profile.role || "student";
            setUserRole(role);
            
            // Fire-and-forget: don't await logging, it's non-critical
            logLoginEvent(db, currentUser, profile).catch((e) => console.warn('logLoginEvent failed:', e));

            if (role === "student") {
              // Fire-and-forget: check approved pass in background, don't block initial render
              checkApprovedPass(currentUser.uid).catch((e) => console.error("checkApprovedPass failed:", e));
            } else {
              setHasApprovedPass(false);
            }
          } else {
            // 🛑 FIX: New user authenticated but no Firestore document found (must be new registration flow)
            console.log("New user detected (no Firestore profile). Redirecting to application.");
            setUserRole("student"); // Assume student role to route them correctly
            setHasApprovedPass(false); // Definitely no pass yet
          }

        } catch (err) {
          console.error("Error fetching user doc/pass:", err);
          setUserRole(null);
          setHasApprovedPass(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setHasApprovedPass(false);
      }
      setLoading(false); // Always set loading to false immediately after user role is determined
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  if (loading) {
  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100px",
          height: "100px",
        }}
      >
        {/* Logo Image */}
        <img
          src="/logo.png" // <-- change this to your logo path
          alt="EventHub Logo"
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            position: "absolute",
            top: "15px",
            left: "15px",
            zIndex: 2,
            animation: "logoPulse 2s infinite ease-in-out",
          }}
        />

        {/* Rotating Ring */}
        <div
          style={{
            width: "100px",
            height: "100px",
            border: "4px solid #d1d5db",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            position: "absolute",
            top: 0,
            left: 0,
            animation: "spin 1s linear infinite",
          }}
        />
      </div>

      <p style={{ marginTop: "20px", fontSize: "18px", color: "#555" }}>
        Loading BusPass
      </p>

      {/* Animation Keyframes */}
      <style>
        {`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          @keyframes logoPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.9; }
          }
        `}
      </style>
    </div>
  );
}

  
  // Determine the default student path based on pass status
  const studentDefaultPath = hasApprovedPass ? "/epass" : "/apply";


  return (
    <Router>
      <Navbar user={user} userRole={userRole} handleLogout={handleLogout} hasApprovedPass={hasApprovedPass} deferredPrompt={deferredPrompt} triggerInstall={triggerInstall} />



      {user ? (
        <>
          {/* STUDENT ROUTES */}
          {userRole === "student" && (
            <Routes>
              {/* CORE LOGIC: Dynamic Root Redirect */}
              <Route path="/" element={<Navigate to={studentDefaultPath} replace />} /> 
              
              <Route path="/home" element={<PageWrapper><Home /></PageWrapper>} />

              {/* /epass route: Displays the pass view */}
              <Route path="/epass" element={<PageWrapper><StudentBusPassView /></PageWrapper>} />
              
              {/* /apply route: Shows form OR redirects user away if they already have a pass */}
              <Route 
                path="/apply" 
                element={
                  hasApprovedPass ? (
                    <Navigate to="/epass" replace />
                  ) : (
                    <PageWrapper><BusPassRequestForm /></PageWrapper>
                  )
                } 
              />
              
              <Route path="/tracking" element={<PageWrapper><TrackingPlaceholder /></PageWrapper>} />
              <Route path="/contact" element={<PageWrapper><ContactUs /></PageWrapper>} />
              <Route path="/notifications" element={<PageWrapper><UserNotifications user={user} /></PageWrapper>} />
              <Route path="/verify-pass" element={<PageWrapper><PassVerification /></PageWrapper>} />
              <Route path="/admin/*" element={<PageWrapper><h2>Access Denied</h2></PageWrapper>} />
              <Route path="*" element={<PageWrapper><h2>404 - Page Not Found</h2></PageWrapper>} />
            </Routes>
          )}

          {/* ADMIN ROUTES */}
          {userRole === "admin" && (
            <Routes>
              <Route path="/" element={<Navigate to="/admin/requests" replace />} />
              <Route path="/admin" element={<Navigate to="/admin/requests" replace />} />
              <Route path="/admin/requests" element={<PageWrapper><AdminDashboard filterProfileType="all" /></PageWrapper>} />
              <Route path="/admin/users" element={<Navigate to="/admin/users/students" replace />} />
              <Route path="/admin/users/students" element={<PageWrapper><AdminUsersTable roleFilter="student" /></PageWrapper>} />
              <Route path="/admin/users/teachers" element={<PageWrapper><AdminUsersTable roleFilter="teacher" /></PageWrapper>} />
              <Route path="/admin/complaints" element={<PageWrapper><AdminComplaints /></PageWrapper>} />
              <Route path="/admin/notifications" element={<PageWrapper><AdminNotifications /></PageWrapper>} />
              <Route path="/admin/all-data" element={<PageWrapper><AllData /></PageWrapper>} />
              <Route path="*" element={<Navigate to="/admin/requests" replace />} />
            </Routes>
          )}

          {/* TEACHER ROUTES */}
          {userRole === "teacher" && (
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          )}
        </>
      ) : (
        // UNAUTHENTICATED ROUTES
        <Routes>
          <Route path="/" element={<AuthPage showRegister={showRegister} setShowRegister={setShowRegister} />} />
          <Route path="/home" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/verify-pass" element={<PageWrapper><PassVerification /></PageWrapper>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
