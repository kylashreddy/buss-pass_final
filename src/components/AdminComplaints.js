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

  if (loading) return <p>Loading complaints...</p>;

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
