// src/components/AdminComplaints.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from "firebase/firestore";

function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setComplaints(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading complaints...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>📢 Complaints</h2>
      {complaints.length === 0 ? (
        <p style={{ textAlign: "center" }}>No complaints yet 🎉</p>
      ) : (
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
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>Email</th>
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>Message</th>
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>Date</th>
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c.id}>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{c.name}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{c.email}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{c.message}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {c.createdAt?.toDate
                    ? c.createdAt.toDate().toLocaleString()
                    : "—"}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  <button
                    onClick={async () => {
                      const name = prompt('Name', c.name || ''); if (name === null) return;
                      const email = prompt('Email', c.email || ''); if (email === null) return;
                      const message = prompt('Message', c.message || ''); if (message === null) return;
                      try {
                        await updateDoc(doc(db, 'complaints', c.id), { name, email, message });
                        alert('✅ Complaint updated');
                      } catch (err) {
                        console.error('Update complaint failed:', err);
                        alert('Failed to update complaint: ' + err.message);
                      }
                    }}
                    style={{ padding: '6px 10px', marginRight: 6, border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer' }}
                  >Edit</button>
                  <button
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
                    style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', cursor: 'pointer' }}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminComplaints;
