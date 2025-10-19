// src/utils/logLoginEvent.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Write a login log to Firestore once per browser session for a user.
// Safe to call repeatedly; guarded by sessionStorage.
export async function logLoginEvent(db, user, profileData) {
  try {
    if (!user) return;
    const sessionKey = `loginLogged:${user.uid}`;
    if (sessionStorage.getItem(sessionKey)) return; // already logged this session

    const payload = {
      userId: user.uid,
      email: (profileData && profileData.email) || user.email || null,
      name: (profileData && profileData.name) || null,
      usn: (profileData && profileData.usn) || null,
      role: (profileData && profileData.role) || null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      platform: typeof navigator !== 'undefined' ? navigator.platform : null,
      timestamp: serverTimestamp(),
      event: 'login'
    };

    await addDoc(collection(db, "loginLogs"), payload);
    sessionStorage.setItem(sessionKey, "1");
  } catch (err) {
    // Non-fatal; just warn so the UI flow is not blocked
    console.warn("Login log write failed:", err);
  }
}
