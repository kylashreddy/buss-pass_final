// src/components/StudentBusPassView.js
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase"; // 👈 Ensure 'storage' is imported from '../firebase'
import { collection, query, where, getDocs } from "firebase/firestore";
// If you are using Firebase Storage, you need the following imports in your actual file:
// import { getStorage, ref, getDownloadURL } from "firebase/storage"; 
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { User, GraduationCap, Route as RouteIcon, MapPin, QrCode, CreditCard, Bus, Calendar } from 'lucide-react';

/**
 * Helper function to safely convert Firestore Timestamp to a Date object.
 * @param {object} v - The value to convert.
 * @returns {Date|null}
 */
const toDate = (v) => (v && typeof v.toDate === 'function') ? v.toDate() : (v instanceof Date ? v : null);

/**
 * MOCK: Placeholder for the actual Firebase Storage fetching function.
 * You must replace this with your actual implementation using Firebase Storage SDK.
 * @param {string} uid - The user's UID.
 * @returns {Promise<string|null>} The download URL or null if not found.
 */
const getProfilePhotoUrl = async (uid) => {
    // Replace this logic with your actual Firebase Storage fetching code
    
    // For now, return a placeholder URL if you have one, or null
    return new Promise(resolve => setTimeout(() => resolve(null), 100)); // Simulate async fetch
};


function StudentBusPassView() {
  const [busPass, setBusPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null); // 👈 New state for Storage URL

  useEffect(() => {
    const fetchBusPass = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        // 1. Fetch Photo URL from Storage
        const storedPhotoUrl = await getProfilePhotoUrl(user.uid);
        setProfilePhotoUrl(storedPhotoUrl);
        
        let allRequests = [];
        
        // Combined list of collections to search (Old and New)
        const collectionsToSearch = [
            "busPassRequests", // New centralized collection
            "route-1","route-2","route-3","route-4","route-5","route-6",
            "route-7","route-8","route-9","route-10","route-11","route-12"
        ];

        for (const colId of collectionsToSearch) {
          const q = query(
            collection(db, colId),
            where("studentId", "==", user.uid)
          );
          
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            allRequests.push({ 
                id: docSnap.id, 
                data: { routeName: data.routeName || colId, ...data }
            });
          });
        }
        
        let latestPass = null;
        
        if (allRequests.length > 0) {
            // Sort all found requests (approved, pending, etc.) to get the most recent one
            const sortedRequests = allRequests.sort((a, b) => {
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
              margin: 4,  // More margin for better edge detection
              errorCorrectionLevel: 'H', // High error correction for better reliability
              type: 'image/png',
              quality: 0.92,
              color: {
                dark: '#000000',  // Pure black for maximum contrast
                light: '#FFFFFF'  // Pure white background
              }
            });
            setQrCodeUrl(qrUrl);
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

  // Determine the photo URL to use: Storage URL takes precedence, then Firestore document URL
  const finalPhotoUrl = profilePhotoUrl || (busPass ? busPass.photoUrl : null);

  if (loading && !busPass) {
  return (
    <div
      className="page-content"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "40px",
      }}
    >
      <div
        style={{
          width: "400px",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "20px",
          position: "relative",
        }}
      >
        {/* Approved Badge */}
        <div
          style={{
            width: "80px",
            height: "24px",
            borderRadius: "12px",
            margin: "0 auto 16px",
            background:
              "linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />

        {/* Profile Circle */}
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            margin: "0 auto 12px",
            background:
              "linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />

        {/* Name & Profile Info */}
        <div style={{ marginBottom: "16px" }}>
          {[60, 40, 80].map((width, i) => (
            <div
              key={i}
              style={{
                height: "12px",
                width: `${width}%`,
                margin: "6px auto",
                borderRadius: "6px",
                background:
                  "linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }}
            />
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            backgroundColor: "#eee",
            margin: "16px 0",
          }}
        />

        {/* Route & Pickup Info */}
        {[70, 50, 40].map((width, i) => (
          <div
            key={i}
            style={{
              height: "12px",
              width: `${width}%`,
              margin: "8px 0",
              borderRadius: "6px",
              background:
                "linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ))}

        {/* QR Code Placeholder */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "12px",
            margin: "20px auto",
            background:
              "linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />

        {/* Signature Placeholder */}
        <div
          style={{
            height: "12px",
            width: "60%",
            margin: "12px auto 0",
            borderRadius: "6px",
            background:
              "linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />
      </div>

      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
    </div>
  );
}





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
          <div className={`ticket-status ${busStatus}`}> 
            {busStatus.toUpperCase()}
          </div>
        </div>

        {/* Profile row */}
        <div className="ticket-profile" style={{ padding: '16px 20px 10px 20px' }}>
          {/* 👈 Increased vertical padding for better spacing */}
          {finalPhotoUrl ? ( 
            <img src={finalPhotoUrl} alt="Profile" className="ticket-photo" />
          ) : (
            <div className="ticket-photo placeholder"><User size={20} /></div>
          )}
          <div className="ticket-profile-info">
            {/* 👈 Name font size increased */}
            <div className="name" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{busPass.studentName}</div>
            {/* 👈 Muted text font size increased */}
            <div className="muted" style={{ fontSize: '0.9rem' }}>USN: {busPass.usn}</div>
            <div className="muted" style={{ fontSize: '0.9rem' }}>Profile: {busPass.profileType || 'Student'} • Year: {busPass.year || '—'}</div>
          </div>
        </div>

        <div className="ticket-divider" />

        {/* Details section */}
        <div className="ticket-body" style={{ padding: '10px 20px' }}>
          <div className="ticket-section-title" style={{ fontSize: '0.9rem' }}>Campus E‑Pass</div>
          
          {/* 👈 Modified ticket-list to flex/grid for single line display */}
          <ul className="ticket-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', padding: '0', listStyle: 'none', margin: '8px 0' }}>
            {/* Route Name (Now on the same line as Pickup) */}
            <li style={{ display: 'flex', alignItems: 'center', fontSize: '1rem', color: '#1f2937', fontWeight: 500 }}>
                <Bus size={18} style={{ marginRight: '6px', color: '#10b981' }} />
                <span style={{ whiteSpace: 'nowrap' }}>Route: {busPass.routeName}</span>
            </li>
            
            {/* Pickup Point (Now on the same line as Route) */}
            <li style={{ display: 'flex', alignItems: 'center', fontSize: '1rem', color: '#1f2937', fontWeight: 500 }}>
                <MapPin size={18} style={{ marginRight: '6px', color: '#f59e0b' }} />
                <span style={{ whiteSpace: 'nowrap' }}>Pickup: {busPass.pickupPoint}</span>
            </li>
            
            {/* Validity date moved below or kept separate as it doesn't fit the 'key-value' pair flow */}
            {busStatus === 'approved' && 
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: '#4b5563' }}>
                <RouteIcon size={16} style={{ marginRight: '6px' }} />
                <span style={{ whiteSpace: 'nowrap' }}>Valid until: {validUntilText}</span>
              </li>
            }
          </ul>
          {/* ------------------------------------------------------------- */}
          
          <div className="ticket-time" style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '10px' }}>
            {busStatus === 'approved' ? 'Approved' : 'Requested'} {issuedText}
          </div>
        </div>

        {/* QR and signature */}
        <div className="epass-body" style={{ padding: '20px' }}>
          <div className="epass-left">
            {finalPhotoUrl ? (
              <img src={finalPhotoUrl} alt="Profile" className="epass-photo" />
            ) : (
              <div className="epass-photo placeholder"><User size={20} /></div>
            )}
            <div className="epass-fields">
              {/* 👈 All epass-kv values font size increased */}
              <div className="epass-kv" style={{ fontSize: '0.95rem' }}><span className="ico"><User size={14} /></span><span className="lab">Name</span><span className="val">{busPass.studentName}</span></div>
              <div className="epass-kv" style={{ fontSize: '0.95rem' }}><span className="ico"><CreditCard size={14} /></span><span className="lab">USN</span><span className="val">{busPass.usn}</span></div>
              <div className="epass-kv" style={{ fontSize: '0.95rem' }}><span className="ico"><Bus size={14} /></span><span className="lab">Profile</span><span className="val">{busPass.profileType || 'Student'}</span></div>
              <div className="epass-kv" style={{ fontSize: '0.95rem' }}><span className="ico"><GraduationCap size={14} /></span><span className="lab">Year</span><span className="val">{busPass.year || '—'}</span></div>
              <div className="epass-kv" style={{ fontSize: '0.95rem' }}><span className="ico"><RouteIcon size={14} /></span><span className="lab">Route</span><span className="val">{busPass.routeName}</span></div>
              <div className="epass-kv" style={{ fontSize: '0.95rem' }}><span className="ico"><MapPin size={14} /></span><span className="lab">Pickup</span><span className="val">{busPass.pickupPoint}</span></div>
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
                fontSize: '14px', // 👈 Increased font size
                color: '#374151',
                fontWeight: '600',
                marginBottom: '12px',
                padding: '8px 14px', // 👈 Increased padding
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
            
            
            <div className="epass-sign" style={{ height: '24px', marginTop: '8px' }}>
              {/* Signature area left empty */}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default StudentBusPassView;