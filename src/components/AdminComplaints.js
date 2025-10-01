// src/components/AdminComplaints.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminComplaints;
