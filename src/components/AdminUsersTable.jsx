import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

function AdminUsersTable({ roleFilter = "student" }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const base = collection(db, "users");
      const conditions = [];
      if (roleFilter && roleFilter !== "all") {
        conditions.push(where("role", "==", roleFilter));
      }
      // Newest first by createdAt if available
      const q = conditions.length
        ? query(base, ...conditions)
        : query(base);

      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = [];
          snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
          // Optional: local sort by createdAt desc if field exists
          list.sort((a, b) => {
            const toMs = (v) => (v && typeof v.toDate === 'function') ? v.toDate().getTime() : (v instanceof Date ? v.getTime() : 0);
            return toMs(b.createdAt) - toMs(a.createdAt);
          });
          setUsers(list);
          setLoading(false);
        },
        (err) => {
          console.error("Error loading users:", err);
          setError("Failed to load users: " + err.message);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.error("Error preparing users query:", err);
      setError("Failed to prepare users query: " + err.message);
      setLoading(false);
    }
  }, [roleFilter]);

  if (loading) return <p>Loading {roleFilter === 'teacher' ? 'teachers' : 'students'}...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const label = roleFilter === 'teacher' ? 'Teachers' : roleFilter === 'student' ? 'Students' : 'Users';

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 6 }}>👥 {label}</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginTop: 0 }}>Total: {users.length}</p>

      {users.length === 0 ? (
        <p>No {label.toLowerCase()} found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <thead style={{ background: '#f3f3f3' }}>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>USN</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={td}>{u.name || '—'}</td>
                  <td style={td}>{u.usn || '—'}</td>
                  <td style={td}>{u.email || '—'}</td>
                  <td style={td}>{u.role || '—'}</td>
                  <td style={td}>{u.createdAt && typeof u.createdAt.toDate === 'function' ? u.createdAt.toDate().toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = { padding: '10px', border: '1px solid #ddd', textAlign: 'left' };
const td = { padding: '10px', border: '1px solid #ddd' };

export default AdminUsersTable;
