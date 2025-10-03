// src/components/StudentBusPassView.js
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion } from 'framer-motion';
// Added Calendar for consistency with modern passes
import { User, GraduationCap, Route as RouteIcon, MapPin, QrCode, CreditCard, Bus, Calendar } from 'lucide-react'; 

/**
 * Helper function to safely convert Firestore Timestamp to a Date object.
 * MOVED OUTSIDE THE COMPONENT TO PREVENT REDEFINITION ERROR.
 * @param {object} v - The value to convert.
 * @returns {Date|null}
 */
const toDate = (v) => (v && typeof v.toDate === 'function') ? v.toDate() : (v instanceof Date ? v : null);


function StudentBusPassView() {
  const [busPass, setBusPass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusPass = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        let allRequests = [];
        
        // Combined list of collections to search (Old and New)
        const collectionsToSearch = [
            "busPassRequests", // New centralized collection
            "route-1","route-2","route-3","route-4","route-5","route-6",
            "route-7","route-8","route-9","route-10","route-11","route-12"
        ];

        for (const colId of collectionsToSearch) {
          // Use the secure UID (user.uid) for the studentId field
          // Note: We intentionally remove the 'status == approved' filter
          // here so students can see their 'pending' passes after requesting.
          const q = query(
            collection(db, colId),
            where("studentId", "==", user.uid)
          );
          
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            allRequests.push({ 
                id: docSnap.id, 
                // Use 'routeName' for the new structure, or fall back to the old collection ID
                data: { routeName: data.routeName || colId, ...data }
            });
          });
        }
        
        let latestPass = null;
        
        if (allRequests.length > 0) {
            // Sort all found requests (approved, pending, etc.) to get the most recent one
            const sortedRequests = allRequests.sort((a, b) => {
                // Prioritize approvalDate/approvedAt, then requestDate for sorting
                const aDate = toDate(a.data.approvalDate) || toDate(a.data.approvedAt) || toDate(a.data.requestDate);
                const bDate = toDate(b.data.approvalDate) || toDate(b.data.approvedAt) || toDate(b.data.requestDate);
                // Return newest pass
                return (bDate?.getTime?.() || 0) - (aDate?.getTime?.() || 0);
            });
            
            latestPass = sortedRequests[0].data;
        }

        setBusPass(latestPass);

      } catch (error) {
        console.error("Error fetching bus pass:", error);
        setBusPass(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBusPass();
  }, []);

  if (loading) return <div className="page-content"><p>Loading your bus pass... 🚌</p></div>;

  if (!busPass) {
    return <div className="page-content"><p>No bus pass request found. Please apply for one. 📝</p></div>;
  }

  // Use the global toDate helper
  const approvedAt = toDate(busPass.approvalDate) || toDate(busPass.approvedAt) || toDate(busPass.requestDate);
  const validUntil = toDate(busPass.validUntil) || (approvedAt ? new Date(approvedAt.getTime() + 365*24*60*60*1000) : null);
  const validUntilText = validUntil ? validUntil.toLocaleDateString() : '—';
  const issuedText = approvedAt ? approvedAt.toLocaleString() : '—';
  const busStatus = busPass.status || 'pending';

  return (
    <div className="page-content" style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", marginTop: "8px" }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="epass-card epass-ticket"
        style={{ width: 'min(420px, 96vw)' }}
      >
        {/* Ticket header */}
        <div className="ticket-head">
          <div className="ticket-brand">
            <img src="/logo.png" alt="CampusBus Logo" className="ticket-logo" />
          </div>
          {/* CRITICAL FIX: Corrected template literal syntax */}
          <div className={`ticket-status ${busStatus}`}> 
            {busStatus.toUpperCase()}
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
            {busStatus === 'approved' && 
             <li><RouteIcon size={16} /><span>Valid until: {validUntilText}</span></li>
            }
          </ul>
          <div className="ticket-time">{busStatus === 'approved' ? 'Approved' : 'Requested'} {issuedText}</div>
        </div>

        {/* QR and signature */}
        <div className="epass-body">
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

          <div className="epass-right">
            {busStatus === 'approved' ? (
                <div className="epass-qr" aria-label="QR code placeholder">
                  <QrCode size={22} className="epass-qr-ico" />
                </div>
            ) : (
                <div className="epass-qr placeholder-pending">
                    <Calendar size={22} />
                    <span style={{fontSize: '0.75rem', marginTop: '5px'}}>Awaiting Approval</span>
                </div>
            )}
            <div className="epass-valid">Valid until: <b>{validUntilText}</b></div>
            <div className="epass-sign">
              <img src="/signature.png" alt="Signature" />
              <span>Authorised Signatory</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default StudentBusPassView;