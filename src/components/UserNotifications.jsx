import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, where, doc, setDoc, serverTimestamp } from "firebase/firestore";

function UserNotifications({ user }) {
  const [items, setItems] = useState([]);
  const [userActions, setUserActions] = useState({});

  useEffect(() => {
    if (!user) return;
    
    // Load notifications
    const notificationsQuery = query(
      collection(db, "notifications"), 
      where("userId", "==", user.uid), 
      orderBy("createdAt", "desc")
    );
    const unsubNotifications = onSnapshot(notificationsQuery, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setItems(arr);
    });
    
    // Load user actions
    const actionsQuery = query(
      collection(db, "userNotificationActions"),
      where("userId", "==", user.uid)
    );
    const unsubActions = onSnapshot(actionsQuery, (snap) => {
      const actions = {};
      snap.forEach((d) => {
        const data = d.data();
        actions[data.notificationId] = data.action;
      });
      setUserActions(actions);
    });
    
    return () => {
      unsubNotifications();
      unsubActions();
    };
  }, [user]);

  const markAsRead = async (n) => {
    try {
      console.log("🔄 Marking notification as read:", n.id);
      
      const userActionRef = doc(db, "userNotificationActions", `${user.uid}_${n.id}`);
      await setDoc(userActionRef, {
        userId: user.uid,
        notificationId: n.id,
        action: "read",
        timestamp: serverTimestamp()
      });
      
      console.log("✅ Successfully marked notification as read!");
      
    } catch (e) {
      console.error("❌ Mark as read failed:", e);
      alert(`❌ Failed to mark notification as read: ${e.message}`);
    }
  };

  const remove = async (n) => {
    try {
      const userActionRef = doc(db, "userNotificationActions", `${user.uid}_${n.id}`);
      await setDoc(userActionRef, {
        userId: user.uid,
        notificationId: n.id,
        action: "deleted",
        timestamp: serverTimestamp()
      });
      
      console.log("Notification hidden for user:", n.id);
    } catch (e) { 
      console.error("Delete failed:", e);
      alert("Failed to delete notification. Please try again.");
    }
  };

  if (!user) return <p style={{ padding: 20 }}>Please log in to view notifications.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: 10 }}>🔔 Notifications</h2>
      <div className="notif-list" style={{ display: "grid", gap: 10, maxWidth: 800, margin: "0 auto" }}>
        {(() => {
          // Filter out deleted notifications
          const visibleItems = items.filter(item => userActions[item.id] !== 'deleted');
          
          if (visibleItems.length === 0) {
            return <div className="notif-empty">No notifications</div>;
          }
          
          return visibleItems.map((item) => {
            const isRead = userActions[item.id] === 'read';
            const displayStatus = isRead ? 'read' : (item.status || 'new');
            
            return (
              <div key={item.id} className={`notif-item ${displayStatus}`}>
                <div className="notif-text">
                  <div className="notif-title">{item.title || "Notification"}</div>
                  <div className="notif-message">{item.message || "—"}</div>
                  <div className="notif-time">
                    {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="notif-actions">
                  {!isRead && (
                    <button 
                      className="btn-chip btn-approve" 
                      onClick={() => markAsRead(item)}
                      title="Mark as read"
                    >
                      <span className="dot" /> Mark Read
                    </button>
                  )}
                  <button 
                    className="btn-chip btn-delete" 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this notification?')) {
                        remove(item);
                      }
                    }}
                    title="Delete notification"
                  >
                    <span className="dot" /> Delete
                  </button>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

export default UserNotifications;


