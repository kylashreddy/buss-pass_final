import React, { useEffect, useMemo, useState, useRef } from "react"; // 👈 Import useRef
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, onSnapshot, query, where, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { debugNotifications, testUpdateNotification } from '../utils/notificationDebug';

function NotificationsBell({ user, userRole, isMobile }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [userActions, setUserActions] = useState({});
  const bellRef = useRef(null); // 👈 Create a ref for the component container

  // --- Click Outside Logic ---
  useEffect(() => {
    if (!open) return; // Only attach listener when the menu is open

    const handleClickOutside = (event) => {
      // Check if the click is outside the bellRef container
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]); // Re-run effect when 'open' changes
  // ---------------------------

  useEffect(() => {
    if (!user) return;

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

  const visibleItems = useMemo(() => items.filter(item => userActions[item.id] !== 'deleted'), [items, userActions]);

  const unreadCount = useMemo(() => visibleItems.filter(item => userActions[item.id] !== 'read' && (!item.status || item.status === "new")).length, [visibleItems, userActions]);

  const markAsRead = async (n) => {
    try {
      const userActionRef = doc(db, "userNotificationActions", `${user.uid}_${n.id}`);
      await setDoc(userActionRef, {
        userId: user.uid,
        notificationId: n.id,
        action: "read",
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Mark as read failed:", e);
      alert(`Failed to mark as read: ${e.message}`);
    }
  };

  const deleteNotification = async (n) => {
    try {
      const userActionRef = doc(db, "userNotificationActions", `${user.uid}_${n.id}`);
      await setDoc(userActionRef, {
        userId: user.uid,
        notificationId: n.id,
        action: "deleted",
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Delete failed", e);
      alert("Failed to delete notification.");
    }
  };

  if (!user) return null;

  // Admin bell links to admin notifications page
  if (userRole === "admin") {
    return (
      <div style={{ position: "relative" }}>
        <Link to="/admin/notifications" className="btn-chip" aria-label="Admin notifications">
          🔔{unreadCount > 0 ? ` ${unreadCount}` : ""}
        </Link>
      </div>
    );
  }

  // --- Style Definitions to Exactly Match the Screenshot ---
  const NotificationCardStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '8px',
    backgroundColor: '#fffcf2', // Very light cream/yellow
    border: '1px solid #ffebcd',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  const ContentStyle = {
    flexGrow: 1,
    paddingRight: '10px',
  };

  const TitleStyle = {
    fontWeight: 700,
    fontSize: '16px',
    color: '#333',
    marginBottom: '2px',
  };

  const MessageStyle = {
    fontSize: '14px',
    color: '#666',
  };

  const ButtonContainerStyle = {
    display: "flex",
    gap: '8px',
    flexShrink: 0,
  };

  const BaseButtonStyle = {
    fontSize: '14px',
    padding: "6px 12px",
    cursor: "pointer",
    borderRadius: '20px', // Capsule shape
    border: '1px solid',
    fontWeight: 500,
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
    minHeight: '30px', // Ensure consistent height
  };

  const MarkReadButtonStyle = {
    ...BaseButtonStyle,
    backgroundColor: '#e3fbe3',
    color: '#1e8449',
    borderColor: '#98df98',
    display: 'flex', // For aligning dot and text
    alignItems: 'center',
  };

  const DeleteButtonStyle = {
    ...BaseButtonStyle,
    backgroundColor: '#ffe3e3',
    color: '#cc0000',
    borderColor: '#ff9898',
  };

  const ReadStatusDotStyle = {
    fontSize: '16px',
    color: '#1e8449',
    marginRight: '4px',
  };
  // -------------------------------------


  const popupStyle = isMobile
    ? {
        position: "fixed",
        bottom: 60, // 👈 Phone notification at the bottom
        left: 0,
        right: 0,
        width: "100%",
        maxHeight: "50vh",
        overflowY: "auto",
        background: "#fff",
        zIndex: 1100,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 8
      }
    : {
        position: "absolute",
        top: "100%",
        right: 0,
        background: "#fff",
        width: 380,
        maxHeight: 400,
        overflowY: "auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        borderRadius: 8,
        padding: 8
      };

  return (
    // Attach the ref to the root element of the bell component
    <div style={{ position: "relative" }} ref={bellRef}> 
      <button
        className="btn-chip"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Notifications"
      >
        🔔{unreadCount > 0 ? ` ${unreadCount}` : ""}
      </button>

      {open && (
        <div style={popupStyle} role="menu" aria-label="Notifications">
          {visibleItems.length === 0 ? (
            <div style={{ padding: 12, textAlign: "center", color: "#666" }}>No notifications</div>
          ) : (
            visibleItems.map((n) => {
              const isRead = userActions[n.id] === 'read';
              // Adjust background for read status
              const cardStyle = isRead
                ? { ...NotificationCardStyle, backgroundColor: '#f5f5f5', border: '1px solid #ddd' }
                : NotificationCardStyle;

              return (
                // Notification Card Container
                <div 
                  key={n.id} 
                  style={cardStyle}
                >
                  {/* Message Content */}
                  <div style={ContentStyle}>
                    <div style={TitleStyle}>{n.title || "Notification"}</div>
                    <div style={MessageStyle}>{n.message || "—"}</div>
                  </div>

                  {/* Action Buttons (side-by-side as in the screenshot) */}
                  <div style={ButtonContainerStyle}>
                    {/* Mark Read Button */}
                    {!isRead && (
                      <button
                        style={MarkReadButtonStyle}
                        onClick={e => { e.stopPropagation(); markAsRead(n); }}
                      >
                        <span style={ReadStatusDotStyle}>•</span>
                        Mark Read
                      </button>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      style={DeleteButtonStyle}
                      onClick={e => { e.stopPropagation(); if (window.confirm("Delete this notification?")) deleteNotification(n); }}
                    >
                      Delete
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