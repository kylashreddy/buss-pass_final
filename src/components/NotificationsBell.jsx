import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, deleteDoc, serverTimestamp, addDoc } from "firebase/firestore";

function NotificationsBell({ user }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setItems(arr);
    });
    return () => unsub();
  }, [user]);

  const unreadCount = useMemo(() => items.filter((i) => (i.status || "new") === "new").length, [items]);

  const acceptNotification = async (n) => {
    try {
      const ref = doc(db, "notifications", n.id);
      await updateDoc(ref, { status: "accepted", actedAt: serverTimestamp() });
      // Optional: write an acknowledgment record
      await addDoc(collection(db, "notificationEvents"), {
        userId: user.uid,
        notificationId: n.id,
        action: "accepted",
        at: serverTimestamp(),
      });
    } catch (e) {
      console.error("Accept failed", e);
    }
  };

  const deleteNotification = async (n) => {
    try {
      await deleteDoc(doc(db, "notifications", n.id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  if (!user) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn-chip"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        🔔 Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
      </button>

      {open && (
        <div className="notif-dropdown" role="menu" aria-label="Notifications">
          {items.length === 0 ? (
            <div className="notif-empty">No notifications</div>
          ) : (
            items.map((n) => (
              <div key={n.id} className={`notif-item ${(n.status || "new")}`}>
                <div className="notif-text">
                  <div className="notif-title">{n.title || "Notification"}</div>
                  <div className="notif-message">{n.message || "—"}</div>
                </div>
                <div className="notif-actions">
                  {(n.status || "new") !== "accepted" && (
                    <button className="btn-chip btn-approve" onClick={() => acceptNotification(n)}>
                      <span className="dot" /> Accept
                    </button>
                  )}
                  <button className="btn-chip btn-delete" onClick={() => deleteNotification(n)}>
                    <span className="dot" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationsBell;


