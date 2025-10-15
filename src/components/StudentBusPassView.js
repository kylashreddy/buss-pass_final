// src/components/StudentBusPassView.js
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
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
  const [qrCodeUrl, setQrCodeUrl] = useState('');

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
        
        // Generate unique QR code for approved passes
        if (latestPass && latestPass.status === 'approved') {
          // Calculate proper validity dates
          const approvalDate = toDate(latestPass.approvalDate) || toDate(latestPass.approvedAt) || new Date();
          const validityPeriodDays = latestPass.validityPeriod || 365; // Default 1 year
          const calculatedValidUntil = new Date(approvalDate.getTime() + validityPeriodDays * 24 * 60 * 60 * 1000);
          const finalValidUntil = toDate(latestPass.validUntil) || calculatedValidUntil;
          
          // Create comprehensive QR data that can be easily scanned and verified
          const qrData = {
            type: 'bus-pass',
            version: '1.0',
            passId: `${user.uid}-${approvalDate.getTime()}`,
            student: {
              id: user.uid,
              name: latestPass.studentName,
              usn: latestPass.usn,
              profileType: latestPass.profileType || 'Student',
              year: latestPass.year || ''
            },
            transport: {
              route: latestPass.routeName,
              pickup: latestPass.pickupPoint
            },
            validity: {
              issuedOn: approvalDate.toISOString(),
              validUntil: finalValidUntil.toISOString(),
              status: 'active'
            },
            verification: {
              issuer: 'Campus Transport Authority',
              verifyUrl: `${window.location.origin}/verify-pass`,
              scanTimestamp: new Date().toISOString()
            }
          };
          
          // Create a verification URL that can be easily scanned and opened
          const verificationUrl = `${window.location.origin}/verify-pass?data=${encodeURIComponent(JSON.stringify(qrData))}`;
          
          // Generate QR code with the verification URL for easy scanning
          try {
            const qrUrl = await QRCode.toDataURL(verificationUrl, {
              width: 256, // Larger size for better scanning
              margin: 4,  // More margin for better edge detection
              errorCorrectionLevel: 'H', // High error correction for better reliability
              type: 'image/png',
              quality: 0.92,
              color: {
                dark: '#000000',  // Pure black for maximum contrast
                light: '#FFFFFF'  // Pure white background
              }
            });
            setQrCodeUrl(qrUrl);
            console.log('🔗 QR Code verification URL:', verificationUrl);
            console.log('📱 QR Code optimized for camera scanning');
          } catch (qrError) {
            console.error('Error generating QR code:', qrError);
          }
        }

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
                <div className="epass-qr-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div className="epass-qr" aria-label="Unique QR code for this user" style={{ marginBottom: '8px' }}>
                    {qrCodeUrl ? (
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code for Bus Pass Verification" 
                        style={{
                          width: '110px', 
                          height: '110px', 
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          cursor: 'pointer',
                          display: 'block',
                          background: '#ffffff',
                          padding: '4px'
                        }} 
                        title="Scan this QR code to verify the bus pass"
                        onClick={() => {
                          // Show QR code in larger view
                          const newWindow = window.open('', '_blank', 'width=500,height=500');
                          newWindow.document.write(`
                            <html>
                              <head>
                                <title>Bus Pass QR Code</title>
                                <meta name="viewport" content="width=device-width, initial-scale=1">
                              </head>
                              <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f9fafb;font-family:system-ui,sans-serif">
                                <div style="text-align:center;padding:20px;background:white;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:90vw">
                                  <h3 style="margin:0 0 20px;color:#1f2937">Bus Pass Verification</h3>
                                  <div style="background:white;padding:16px;border-radius:12px;border:2px solid #e5e7eb;display:inline-block">
                                    <img src="${qrCodeUrl}" alt="QR Code" style="width:280px;height:280px;display:block" />
                                  </div>
                                  <p style="margin:16px 0 0;color:#6b7280;font-size:14px;max-width:300px">Scan this code with any QR scanner or camera app to verify the bus pass</p>
                                  <button onclick="window.close()" style="margin-top:16px;padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer">Close</button>
                                </div>
                              </body>
                            </html>
                          `);
                        }}
                      />
                    ) : (
                      <QrCode size={22} className="epass-qr-ico" />
                    )}
                  </div>
                </div>
            ) : (
                <div className="epass-qr placeholder-pending">
                    <Calendar size={22} />
                    <span style={{fontSize: '0.75rem', marginTop: '5px'}}>Awaiting Approval</span>
                </div>
            )}
            
            {/* Separate valid until section with better spacing */}
            <div className="epass-validity-section" style={{ marginTop: '16px', textAlign: 'center' }}>
              <div className="epass-valid" style={{ 
                fontSize: '12px', 
                color: '#374151',
                fontWeight: '600',
                marginBottom: '12px',
                padding: '6px 12px',
                background: busStatus === 'approved' ? '#f0fdf4' : '#fef3f2',
                border: `1px solid ${busStatus === 'approved' ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '6px',
                display: 'inline-block'
              }}>
                {busStatus === 'approved' ? '✅ Valid until: ' : '⏳ Pending approval'}
                <span style={{ color: busStatus === 'approved' ? '#166534' : '#b91c1c' }}>
                  {busStatus === 'approved' ? validUntilText : ''}
                </span>
              </div>
            </div>
            
            <div className="epass-sign" style={{ marginTop: '8px' }}>
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