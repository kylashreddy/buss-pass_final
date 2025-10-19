// src/components/AdminComplaints.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from "firebase/firestore";
import EditDialog from './EditDialog';

function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((d) => data.push({ id: d.id, ...d.data() }));
      setComplaints(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

 if (loading)
  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      {/* Header */}
      <h2
        style={{
          textAlign: "center",
          marginBottom: "25px",
          fontWeight: "600",
          color: "#1e293b",
        }}
      >
        📨 Complaints
      </h2>

      {/* Table Container */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          padding: "20px",
          overflowX: "auto",
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr 1.5fr 1fr 1fr",
            gap: "15px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "10px",
            marginBottom: "10px",
          }}
        >
          {["Name", "Email", "Message", "Date", "Actions"].map((title, i) => (
            <div
              key={i}
              style={{
                height: "20px",
                borderRadius: "6px",
                background:
                  "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
                backgroundSize: "200% 100%",
                animation: "skeletonLoading 1.6s infinite",
                width: "60%",
              }}
            ></div>
          ))}
        </div>

        {/* Table Rows */}
        {[...Array(3)].map((_, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.5fr 1.5fr 1fr 1fr",
              gap: "15px",
              marginBottom: "12px",
              alignItems: "center",
            }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: "20px",
                  borderRadius: "6px",
                  background:
                    "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
                  backgroundSize: "200% 100%",
                  animation: "skeletonLoading 1.6s infinite",
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>

      {/* Loading text */}
      <p style={{ textAlign: "center", color: "#64748b", marginTop: "20px" }}>
        Loading complaints...
      </p>

      {/* Animation keyframes */}
      <style>
        {`
          @keyframes skeletonLoading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );


  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>📢 Complaints</h2>
      {complaints.length === 0 ? (
        <p style={{ textAlign: "center" }}>No complaints yet 🎉</p>
      ) : (
        <table className="ui-table" style={{ minWidth: "800px" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Message</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="truncate">{c.email}</td>
                <td>{c.message}</td>
                <td>{c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : '—'}</td>
                <td>
                  <button className="btn-chip btn-edit goo" onClick={() => setEditing(c)}>
                    <span className="dot" /> Edit
                  </button>
                  <button className="btn-chip btn-delete" style={{ marginLeft: 8 }}
                    onClick={async () => {
                      if (!window.confirm('Delete this complaint?')) return;
                      try {
                        await deleteDoc(doc(db, 'complaints', c.id));
                        alert('🗑️ Complaint deleted');
                      } catch (err) {
                        console.error('Delete complaint failed:', err);
                        alert('Failed to delete complaint: ' + err.message);
                      }
                    }}
                  >
                    <span className="dot" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <EditDialog
        open={!!editing}
        title={editing ? `Edit complaint by ${editing.name || editing.email}` : ''}
        fields={[
          { name: 'name', label: 'Name', value: editing?.name || '' },
          { name: 'email', label: 'Email', value: editing?.email || '' },
          { name: 'message', label: 'Message', type: 'textarea', value: editing?.message || '' },
        ]}
        onChange={(k, v) => setEditing(prev => ({ ...prev, [k]: v }))}
        onClose={() => setEditing(null)}
        onSave={async () => {
          try {
            if (!editing) return;
            const { id, name, email, message } = editing;
            await updateDoc(doc(db, 'complaints', id), { name, email, message });
            alert('\u2705 Complaint updated');
            setEditing(null);
          } catch (err) {
            console.error('Update complaint failed:', err);
            alert('Failed to update complaint: ' + err.message);
          }
        }}
      />
    </div>
  );
}

export default AdminComplaints;
