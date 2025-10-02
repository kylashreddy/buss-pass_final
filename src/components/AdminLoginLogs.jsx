import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

function AdminLoginLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Show latest 200 logins
      const q = query(collection(db, "loginLogs"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
          // Local sort by timestamp desc
          list.sort((a, b) => {
            const toMs = (v) => (v && typeof v.toDate === 'function') ? v.toDate().getTime() : (v instanceof Date ? v.getTime() : 0);
            return toMs(b.timestamp) - toMs(a.timestamp);
          });
          setLogs(list.slice(0, 200));
          setLoading(false);
        },
        (err) => {
          console.error("Error loading login logs:", err);
          setError("Failed to load login logs: " + err.message);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.error("Error preparing login logs query:", err);
      setError("Failed to prepare login logs query: " + err.message);
      setLoading(false);
    }
  }, []);

  if (loading) return <p>Loading login logs...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 6 }}>🔐 Login Log</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginTop: 0 }}>Entries: {logs.length}</p>

      {logs.length === 0 ? (
        <p>No login events yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <thead style={{ background: '#f3f3f3' }}>
              <tr>
                <th style={th}>Time</th>
                <th style={th}>Name</th>
                <th style={th}>USN</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={td}>{log.timestamp && typeof log.timestamp.toDate === 'function' ? log.timestamp.toDate().toLocaleString() : '—'}</td>
                  <td style={td}>{log.name || '—'}</td>
                  <td style={td}>{log.usn || '—'}</td>
                  <td style={td}>{log.email || '—'}</td>
                  <td style={td}>{log.role || '—'}</td>
                  <td style={td} title={log.userAgent || ''}>
                    {(log.userAgent || '').slice(0, 60)}{(log.userAgent || '').length > 60 ? '…' : ''}
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

const th = { padding: '10px', border: '1px solid #ddd', textAlign: 'left' };
const td = { padding: '10px', border: '1px solid #ddd' };

export default AdminLoginLogs;
