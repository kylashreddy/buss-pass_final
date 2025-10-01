// src/components/AdminDashboard.js
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

function AdminDashboard() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch only pending bus pass requests
  useEffect(() => {
    const q = query(
      collection(db, "busPassRequests"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const requests = [];
        querySnapshot.forEach((document) => {
          requests.push({ id: document.id, ...document.data() });
        });
        setPendingRequests(requests);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching requests:", err);
        setError("Failed to load requests: " + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleApprove = async (requestId) => {
    try {
      const requestRef = doc(db, "busPassRequests", requestId);
      await updateDoc(requestRef, {
        status: "approved",
        adminId: auth.currentUser.uid,
        approvalDate: new Date(),
      });
      alert("✅ Request approved!");
    } catch (err) {
      console.error("Error approving:", err);
      setError("Failed to approve: " + err.message);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt("Enter reason for rejection (optional):");
    try {
      const requestRef = doc(db, "busPassRequests", requestId);
      await updateDoc(requestRef, {
        status: "rejected",
        adminId: auth.currentUser.uid,
        approvalDate: new Date(),
        rejectionReason: reason || "No reason provided",
      });
      alert("❌ Request rejected!");
    } catch (err) {
      console.error("Error rejecting:", err);
      setError("Failed to reject: " + err.message);
    }
  };

  if (loading) return <p>Loading requests...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>📋 Pending Bus Pass Requests</h2>
      {pendingRequests.length === 0 ? (
        <p>No pending requests 🎉</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <thead style={{ background: "#f3f3f3" }}>
              <tr>
                <th style={thStyle}>Student Name</th>
                <th style={thStyle}>USN</th>
                <th style={thStyle}>Route</th>
                <th style={thStyle}>Pickup Point</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((req) => (
                <tr key={req.id}>
                  <td style={tdStyle}>{req.studentName}</td>
                  <td style={tdStyle}>{req.usn}</td>
                  <td style={tdStyle}>{req.routeName}</td>
                  <td style={tdStyle}>{req.pickupPoint}</td>
                  <td style={{ ...tdStyle, color: "orange", fontWeight: "bold" }}>
                    {req.status}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleApprove(req.id)}
                      style={approveBtn}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      style={rejectBtn}
                    >
                      ❌ Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Reusable styles
const thStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #ddd",
};

const approveBtn = {
  padding: "6px 12px",
  background: "green",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "8px",
};

const rejectBtn = {
  padding: "6px 12px",
  background: "red",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

export default AdminDashboard;
