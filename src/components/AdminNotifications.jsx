import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from "firebase/firestore";

function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  // Broadcast-only UI: no target or role filters
  const [status, setStatus] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setItems(arr);
    });
    return () => unsub();
  }, []);

  const canSend = title.trim().length > 0 && message.trim().length > 0;

  const sendToAll = async () => {
    if (!canSend) return setStatus({ type: "error", msg: "Title and message required" });
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const userIds = usersSnap.docs.map((d) => d.id);
      if (userIds.length === 0) return setStatus({ type: "error", msg: "No users found" });
      const broadcastKey = `bcast_${Date.now()}`;
      await Promise.all(
        userIds.map((uid) => addDoc(collection(db, "notifications"), {
          userId: uid,
          title: title.trim(),
          message: message.trim(),
          status: "new",
          createdAt: serverTimestamp(),
          broadcastKey,
        }))
      );
      setStatus({ type: "success", msg: `Sent to all users (${userIds.length})` });
    } catch (e) {
      setStatus({ type: "error", msg: e.message });
    }
  };



  return (
    <div className="admin-notif" style={{ padding: 20 }}>
      <h2 className="admin-notif-title" style={{ textAlign: "center", marginBottom: 10 }}>🔔 Admin Notifications</h2>
      <div className="admin-notif-card">
        <div className="admin-notif-grid">
          <input className="admin-notif-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <textarea className="admin-notif-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" rows={3} />
          <div className="admin-notif-row">
            <button className="btn-chip btn-approve" onClick={sendToAll}>
              <span className="dot" /> Send to All Users
            </button>
          </div>
          {status && (
            <div className={`admin-notif-status ${status.type}`}>{status.msg}</div>
          )}
        </div>
      </div>

      <h3 className="admin-notif-subtitle" style={{ margin: "18px 0 10px" }}>Recent notifications</h3>
      <div className="notif-list" style={{ display: "grid", gap: 10 }}>
        {(() => {
          if (items.length === 0) return <div className="notif-empty">No notifications yet</div>;

          // Group notifications by broadcastKey if present, otherwise by title+message (coarse)
          const groups = new Map();
          for (const n of items) {
            const key = n.broadcastKey || `${n.title}|${n.message}`;
            if (!groups.has(key)) {
              groups.set(key, { sample: n, count: 1 });
            } else {
              groups.get(key).count += 1;
            }
          }
          const groupedList = Array.from(groups.values());

          return groupedList.map(({ sample, count }, idx) => (
            <div key={(sample.broadcastKey || sample.id) + '_' + idx} className="notif-item">
              <div className="notif-text">
                <div className="notif-title">{sample.title || "Notification"}</div>
                <div className="notif-message">{sample.message || "—"} {count > 1 && <span style={{ color: '#6b7280' }}>• sent to {count} users</span>}</div>
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

export default AdminNotifications;


