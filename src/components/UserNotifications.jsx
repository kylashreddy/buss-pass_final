import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, where, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

function UserNotifications({ user }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setItems(arr);
    });
    return () => unsub();
  }, [user]);

  const accept = async (n) => {
    try {
      await updateDoc(doc(db, "notifications", n.id), { status: "accepted", actedAt: serverTimestamp() });
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (n) => {
    try { await deleteDoc(doc(db, "notifications", n.id)); } catch (e) { console.error(e); }
  };

  if (!user) return <p style={{ padding: 20 }}>Please log in to view notifications.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: 10 }}>🔔 Notifications</h2>
      <div className="notif-list" style={{ display: "grid", gap: 10, maxWidth: 800, margin: "0 auto" }}>
        {items.length === 0 ? (
          <div className="notif-empty">No notifications</div>
        ) : (
          (() => {
            const first = items[0];
            return (
              <div className={`notif-item ${(first.status || "new")}`}>
                <div className="notif-text">
                  <div className="notif-title">{first.title || "Notification"}</div>
                  <div className="notif-message">{first.message || "—"}</div>
                </div>
                <div className="notif-actions">
                  {(first.status || "new") !== "accepted" && (
                    <button className="btn-chip btn-approve" onClick={() => accept(first)}>
                      <span className="dot" /> Accept
                    </button>
                  )}
                  <button className="btn-chip btn-delete" onClick={() => remove(first)}>
                    <span className="dot" /> Delete
                  </button>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

export default UserNotifications;


