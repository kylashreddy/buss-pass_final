import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, onSnapshot, query, where, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { debugNotifications, testUpdateNotification } from '../utils/notificationDebug';

function NotificationsBell({ user, userRole }) {
  const [open, setOpen] = useState(false);
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

  // Filter out deleted notifications and calculate unread count based on user actions
  const visibleItems = useMemo(() => {
    return items.filter(item => userActions[item.id] !== 'deleted');
  }, [items, userActions]);
  
  const unreadCount = useMemo(() => {
    return visibleItems.filter(item => {
      // Check if user has marked as read
      if (userActions[item.id] === 'read') return false;
      // Otherwise, check original status
      return !item.status || item.status === "new";
    }).length;
  }, [visibleItems, userActions]);

  const markAsRead = async (n) => {
    try {
      console.log("🔄 Marking notification as read:", n.id);
      
      // Instead of updating the notification document, create a user action record
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
      
      if (e.code === 'permission-denied') {
        alert('❌ Permission denied. Please try again or contact support.');
      } else {
        alert(`❌ Failed to mark notification as read: ${e.message}`);
      }
    }
  };

  const deleteNotification = async (n) => {
    try {
      // Instead of deleting the notification, mark it as hidden for this user
      const userActionRef = doc(db, "userNotificationActions", `${user.uid}_${n.id}`);
      
      await setDoc(userActionRef, {
        userId: user.uid,
        notificationId: n.id,
        action: "deleted",
        timestamp: serverTimestamp()
      });
      
      console.log("Notification hidden for user:", n.id);
    } catch (e) {
      console.error("Delete failed", e);
      alert("Failed to delete notification. Please try again.");
    }
  };

  // Debug function to test notification functionality
  const runDebug = async () => {
    console.log('🔍 Running notification debug...');
    const result = await debugNotifications();
    console.log('Debug result:', result);
    
    if (result.notifications && result.notifications.length > 0) {
      const firstNotif = result.notifications[0];
      console.log('🧪 Testing update on first notification:', firstNotif.id);
      try {
        await testUpdateNotification(firstNotif.id);
        console.log('✅ Test update successful!');
      } catch (err) {
        console.error('❌ Test update failed:', err);
      }
    }
  };

  if (!user) return null;

  // If the logged-in user is an admin, make the bell navigate to the admin
  // notifications page instead of rendering the per-user dropdown.
  if (userRole === "admin") {
    return (
      <div style={{ position: "relative" }}>
        <Link to="/admin/notifications" className="btn-chip" aria-label="Admin notifications">
          🔔{unreadCount > 0 ? ` ${unreadCount}` : ""}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn-chip"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Notifications"
      >
        🔔{unreadCount > 0 ? ` ${unreadCount}` : ""}
      </button>

      {open && (
        <div className="notif-dropdown" role="menu" aria-label="Notifications">
          {visibleItems.length === 0 ? (
            <div className="notif-empty">No notifications</div>
          ) : (
            visibleItems.map((n) => {
              const isRead = userActions[n.id] === 'read';
              const displayStatus = isRead ? 'read' : (n.status || 'new');
              
              return (
                <div key={n.id} className={`notif-item ${displayStatus}`}>
                  <div className="notif-text">
                    <div className="notif-title">{n.title || "Notification"}</div>
                    <div className="notif-message">{n.message || "—"}</div>
                  </div>
                  <div className="notif-actions">
                    {!isRead && (
                      <button 
                        className="btn-chip btn-approve" 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n);
                        }}
                        title="Mark as read"
                      >
                        <span className="dot" /> Mark Read
                      </button>
                    )}
                    <button 
                      className="btn-chip btn-delete" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this notification?')) {
                          deleteNotification(n);
                        }
                      }}
                      title="Delete notification"
                    >
                      <span className="dot" /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationsBell;


