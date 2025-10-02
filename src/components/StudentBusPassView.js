import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion } from 'framer-motion';
import { User, GraduationCap, Route as RouteIcon, MapPin, QrCode, CreditCard, Bus } from 'lucide-react';

function StudentBusPassView() {
  const [busPass, setBusPass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusPass = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "busPassRequests"),
          where("studentId", "==", user.uid),
          where("status", "==", "approved")
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Choose the most recent approved pass (by approvedAt or requestDate)
          const docs = querySnapshot.docs
            .map(d => ({ id: d.id, data: d.data() }))
            .sort((a, b) => {
              const toDate = (v) => (v && typeof v.toDate === 'function') ? v.toDate() : (v instanceof Date ? v : new Date(0));
              const aDate = toDate(a.data.approvedAt) || toDate(a.data.requestDate);
              const bDate = toDate(b.data.approvedAt) || toDate(b.data.requestDate);
              return (bDate?.getTime?.() || 0) - (aDate?.getTime?.() || 0);
            });
          setBusPass(docs[0].data);
        } else {
          setBusPass(null);
        }
      } catch (error) {
        console.error("Error fetching bus pass:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusPass();
  }, []);

  if (loading) {
    return <div className="page-content"><p>Loading your bus pass...</p></div>;
  }

  if (!busPass) {
    return <div className="page-content"><p>No bus pass found. Please request one.</p></div>;
  }

  // Compute validity window
  const toDate = (v) => (v && typeof v.toDate === 'function') ? v.toDate() : (v instanceof Date ? v : null);
  const approvedAt = toDate(busPass.approvedAt) || toDate(busPass.requestDate);
  const validUntil = toDate(busPass.validUntil) || (approvedAt ? new Date(approvedAt.getTime() + 365 * 24 * 60 * 60 * 1000) : null);
  const validUntilText = validUntil ? validUntil.toLocaleDateString() : '—';

  return (
    <div className="page-content" style={{ display: "flex", justifyContent: "center" }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
transition={{ duration: 0.35, ease: 'easeOut' }}
className="epass-card epass-ticket"
        style={{ width: 'min(420px, 96vw)' }}
      >
        {/* Ticket header with brand */}
        <div className="ticket-head">
          <div className="ticket-brand">
            <img src="/logo.png" alt="CampusBus" className="ticket-logo" />
            <span>CampusBus</span>
          </div>
        </div>

        {/* Profile row */}
        <div className="ticket-profile">
          {busPass.photoUrl ? (
            <img src={busPass.photoUrl} alt="Profile" className="ticket-photo" />
          ) : (
            <div className="ticket-photo placeholder"><User size={18} /></div>
          )}
          <div className="ticket-profile-info">
            <div className="name">{busPass.studentName}</div>
            <div className="muted">USN: {busPass.usn}</div>
            <div className="muted">Profile: {busPass.profileType || 'Student'} • Year: {busPass.year || '—'}</div>
          </div>
        </div>

        <div className="ticket-divider" />

        {/* Details section */}
        <div className="ticket-body">
          <div className="ticket-section-title">Campus E‑Pass</div>
          <ul className="ticket-list">
            <li><Bus size={16} /><span>{busPass.routeName}</span></li>
            <li><MapPin size={16} /><span>{busPass.pickupPoint}</span></li>
            <li><RouteIcon size={16} /><span>Valid until: {validUntilText}</span></li>
          </ul>
          <div className="ticket-time">Issued {approvedAt ? approvedAt.toLocaleString() : '—'}</div>

          <div className="ticket-qr-wrap">
            <div className="ticket-qr" aria-label="QR code placeholder">
              <QrCode size={28} />
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className={`epass-status ${busPass.status || 'pending'}`}>
          <div className="epass-brand">
            <img src="/logo.png" alt="CampusBus" className="epass-logo" />
            <div>
              <div className="epass-brand-title">JAIN</div>
              <div className="epass-brand-sub">Faculty of Engineering & Technology</div>
            </div>
          </div>
          <div className="epass-title">CAMPUSBUS E‑PASS</div>
          <div className="epass-chip" aria-hidden />
        </div>

        {/* Body */}
        <div className="epass-body">
          {/* Left details */}
          <div className="epass-left">
            {busPass.photoUrl ? (
              <img src={busPass.photoUrl} alt="Profile" className="epass-photo" />
            ) : (
              <div className="epass-photo placeholder"><User size={18} /></div>
            )}

            <div className="epass-fields">
              <div className="epass-kv"><span className="ico"><User size={14} /></span><span className="lab">Name</span><span className="val">{busPass.studentName}</span></div>
              <div className="epass-kv"><span className="ico"><CreditCard size={14} /></span><span className="lab">USN</span><span className="val">{busPass.usn}</span></div>
              <div className="epass-kv"><span className="ico"><Bus size={14} /></span><span className="lab">Profile</span><span className="val">{busPass.profileType || 'Student'}</span></div>
              <div className="epass-kv"><span className="ico"><GraduationCap size={14} /></span><span className="lab">Year</span><span className="val">{busPass.year || '—'}</span></div>
              <div className="epass-kv"><span className="ico"><RouteIcon size={14} /></span><span className="lab">Route</span><span className="val">{busPass.routeName}</span></div>
              <div className="epass-kv"><span className="ico"><MapPin size={14} /></span><span className="lab">Pickup</span><span className="val">{busPass.pickupPoint}</span></div>
            </div>
          </div>

          {/* Right visuals */}
          <div className="epass-right">
            <div className="epass-qr" aria-label="QR code placeholder">
              <QrCode size={22} className="epass-qr-ico" />
            </div>
            <div className="epass-valid">Valid until: <b>{validUntilText}</b></div>
            <div className="epass-sign">
              <img src="/signature.png" alt="Signature" />
              <span>Authorised Signatory</span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className={`epass-status ${busPass.status || 'pending'}`}>
          {(busPass.status || 'pending').toUpperCase()}
        </div>
      </motion.div>
    </div>
  );
}

export default StudentBusPassView;
