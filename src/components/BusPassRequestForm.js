// src/components/BusPassRequestForm.js
import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from 'framer-motion';
import { Bus, MapPin, Route as RouteIcon, GraduationCap, Image as ImageIcon, Receipt } from 'lucide-react';

// Helper: Route data from CSV (manually extracted for performance)
const routeData = {
  "Route 1": [
    "HEBBAL FLY OVER", "CBI", "MEKHRI CIRCLE", "FREEDAM PARK", "CORPORATION", "LALBAGH MAIN GATE", "TEACHER (R V ROAD)", "YEDIYUR", "BANASHANKARI BUS", "JP NAGAR SIGNAL", "YELACHENAHALLI"
  ],
  "Route 2": [
    "CHAMARAJ PET", "NANDINI STOP", "RAMAKRISHNA ASHRAM", "HANUMANTHANAGAR", "PES COLLEGE", "MUNESHWARA BLOCK", "SRINAGAR", "SITA CIRCLE", "BANK COLONY", "VIDYAPEETA CIRCLE", "SHANIMAHATMA TEMPLE", "KATHRIGUPPE SIGNAL", "DG PETROL PUMP", "KADIRENAHALLI", "CHIKKALASANDRA", "UTTARAHALLI", "SHANIMAHATMA TEMPLE (GUBBALALA)", "KSIT SIGNAL", "JNANA SWEEKAR SCHOOL"
  ],
  "Route 3": [
    "VEERABHADHRA NAGARA", "PES COLLEGE", "HOSAKEREHALLI PETROL BUNK", "KATHRIGUPPE", "KAMAKHYA", "SAGAR HOSPITAL", "KUMARSWAMY LAYOUT", "ISRO LAYOUT", "MANASA THEATER", "K K CROSS", "DODDAKALLASANDRA", "GUBBALALA GATE", "SHARMA GARAGE", "TALAGHATTAPURA", "VAJRAMUNESHWARA TEMPLE", "SILK INSTITUTE", "AGARA CROSS", "KUPPAREDDY KERE", "KAGGALIPURA"
  ],
  "Route 4": [
    "YELAHANKA MOTHER DAIRY", "M.S PALYA", "GANGAMMA CIRCLE", "SHETTIHALLI CROSS", "JALAHALLI CIRCLE", "KANTIRAVA STUDIO", "LAGGERE BRIDGE", "KOTTIGEPALYA", "BDA COMPLEX", "DEEPLA COMPLEX", "DR. AMBEDKAR INSTITUTE OF TECHNOLOGY", "MARIYAPPANA PALYA", "HOYSALA CIRCLE", "RAILWAY STATION", "KENGERI POST OFFICE", "KENGERI METRO", "RR MEDICAL COLLEGE", "ACHEPALAYA", "BIDADI CROSS"
  ],
  "Route 5": [
    "BEL CIRCLE", "DOLLARS COLONY", "IISC", "MALLESWARAM 18TH CROSS", "DEVAIAH PARK", "NAVARANG THEATER", "WOC BOOTS SHOWROOM", "GIRIAS SHOWROOM", "MAGADI ROAD TOLLGATE", "VIJAYANAGAR BUS STOP", "CHANDRA LAYOUT", "NAGARBHAVI CIRCLE", "NAYANDAHALLI", "RAJARAJESHWARI NAGAR GATE", "LCIS (HV HALLI)", "SBI (RR NAGAR)", "KANTHI SWEETS (DOUBLE ROAD)"
  ],
  "Route 6": [
    "SHANTHINAGAR BUS STATION", "WILSON GARDEN", "ASHOKA PILLAR", "JAYANAGAR 4TH", "RAGAVENDRA TEMPLE", "RVDC", "NANDHINI HOTEL", "BRIGADE MILLENNIUM", "GAURAV NAGAR", "JUMBU SAVARI DENNE", "HM WORLD CITY", "TIPPU CIRCLE"
  ],
  "Route 7": [
    "KAMMANAHALLI CIRCLE", "RAMMURTHY NAGAR", "KR PURAM RLY STATION", "MARATHAHALLI", "H.S.R LAYOUT", "SILK BOARD", "BTM LAYOUT"
  ],
  "Route 8": [
    "HOSKUR GATE", "ELECTRONIC CITY", "KONAPPANA AGRAHARA", "HOSA ROAD", "SINGASANDRA BUS STOP", "KUDLU GATE", "GARVEBHAVI PLAYA", "BOMMANAHALLI", "BTM LAYOUT 29TH MAIN ROAD", "IIM", "HULIMAVU GATE"
  ],
  "Route 9": [
    "FRAZER TOWN NEAR CLARENCE SCHOOL", "ULSOOR GANESHA TEMPLE", "RTO INDIRANAGAR", "INDIRANAGAR KFC ROAD", "DOMULAR BUS STOP - BRIDGE", "KORAMANGALA NGV", "SONY SIGNAL", "KORAMANGALA FIRST BLOCK", "CHRIST COLLEGE / DAIRY CIRCLE", "SAGAR APOLLO", "JAYADEVA HOSPITAL/ GOPALAN MALL", "VEGA CITY MALL", "HARINAGARA CROSS", "SOUDHAMINI KALYANA MANTAPA", "UDIPALYA", "NAPA VALLEY"
  ],
  "Route 10": [
    "YESHWANTHPUR BUS STOP", "NAVARANG BRIDGE", "SHANKAR MUTTA", "BASAVESHWARA NAGAR", "HOUSING BOARD", "MUDALAPALAYA", "NAGARBHAVI CIRCLE", "ULLAL QUARTERS", "BRIGADE MEADOWS"
  ],
  "Route 11": [
    "BTM WATER TANK", "JAYADHEVA HOSPITAL", "JAYANAGAR 9TH BLOCK", "VEGHA CITY MALL", "MEENAKSHI MALL", "AGARA CROSS", "CARMEL SCHOOL", "GOTTIGERE", "RAGHUVANAHALLI BUS STOP"
  ],
  "Route 12": [
    "KSIT BUS STOP", "SHARMA GARAGE", "TALAGHATTAPURA", "BRIGADE MEADOWS", "KAGALIPURA", "SOMANAHALLI", "HAROHALLI"
  ]
};

function BusPassRequestForm() {
  const [routeName, setRouteName] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [error, setError] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [year, setYear] = useState('');
  const [profileType, setProfileType] = useState('student');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState(null);
  const [paymentReceiptPreview, setPaymentReceiptPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hasActiveApplication, setHasActiveApplication] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const [checkingApplications, setCheckingApplications] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUserData(userDocSnap.data());
          } else {
            setError("Could not retrieve your user details. Please try again.");
          }
        } catch (err) {
          setError("Failed to load user details: " + err.message);
        } finally {
          setLoadingUserData(false);
        }
      } else {
        setError("You must be logged in to submit a request.");
        setLoadingUserData(false);
      }
    };
    fetchUserData();
  }, []);

  // After user data loads, check for any existing pending/approved applications
  useEffect(() => {
    const checkExistingApplications = async () => {
      if (!auth.currentUser) {
        setCheckingApplications(false);
        return;
      }
      setCheckingApplications(true);
      try {
        const uid = auth.currentUser.uid;
        for (const route of Object.keys(routeData)) {
          const routeCollection = route.toLowerCase().replace(/\s+/g, "-");
          try {
            const q = query(
              collection(db, routeCollection),
              where("studentId", "==", uid),
              where("status", "in", ["pending", "approved"])
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              const docSnap = snap.docs[0];
              setExistingApplication({ id: docSnap.id, ...docSnap.data(), routeCollection });
              setHasActiveApplication(true);
              break;
            }
          } catch (e) {
            // ignore errors for individual route collections and continue
          }
        }
      } catch (e) {
        console.error('Error checking existing applications:', e);
      } finally {
        setCheckingApplications(false);
      }
    };

    if (!loadingUserData && auth.currentUser) {
      checkExistingApplications();
    } else {
      // if no user/loading state, stop checking
      setCheckingApplications(false);
    }
  }, [loadingUserData]);

  // Handle photo file selection
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle payment receipt file selection
  const handlePaymentReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Receipt size must be less than 5MB');
        return;
      }
      setPaymentReceiptFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload file to Firebase Storage
  const uploadFile = async (file, path) => {
    try {
      // Ensure user is authenticated
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to upload files');
      }
      
      // Create storage reference
      const storageRef = ref(storage, path);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL - FIXED: changed from snapshot.reference to snapshot.ref
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus(null);
    setError(null);

    if (!auth.currentUser || !currentUserData) {
      setError("User not authenticated or data not loaded.");
      return;
    }

    if (hasActiveApplication) {
      setError(
        existingApplication && existingApplication.status
          ? `You already have an active application (status: ${existingApplication.status}). You cannot apply again.`
          : 'You already have an active bus pass application and cannot apply again at this time.'
      );
      return;
    }

    const requireYear = profileType !== 'teacher';
    if (!routeName || !pickupPoint || (requireYear && !year)) {
      setError(requireYear
        ? "Please fill in all required fields (Route, Pickup, Year)."
        : "Please fill in all required fields (Route, Pickup)."
      );
      return;
    }

    if (!photoFile) {
      setError("Please upload your photo.");
      return;
    }

    // Payment receipt is now required
    if (!paymentReceiptFile) {
      setError("Please upload the payment receipt.");
      return;
    }

    try {
      setUploading(true);

      // Upload photo to Firebase Storage
      const timestamp = Date.now();
      const photoPath = `bus-pass-photos/${auth.currentUser.uid}/${timestamp}_photo.${photoFile.name.split('.').pop()}`;
      const photoURL = await uploadFile(photoFile, photoPath);

      // Upload payment receipt if provided
      let paymentReceiptURL = null;
      if (paymentReceiptFile) {
        const receiptPath = `bus-pass-receipts/${auth.currentUser.uid}/${timestamp}_receipt.${paymentReceiptFile.name.split('.').pop()}`;
        paymentReceiptURL = await uploadFile(paymentReceiptFile, receiptPath);
      }

      // Convert "Route 1" → "route-1"
      const routeCollection = routeName.toLowerCase().replace(/\s+/g, "-");

      // Save to Firestore — guard against undefined user fields
      // Prefer `name`, but fall back to legacy `fullName` for older user docs
      const resolvedName = (currentUserData && (currentUserData.name || currentUserData.fullName)) ? (currentUserData.name || currentUserData.fullName) : (auth.currentUser.displayName || null);
      const resolvedUsn = (currentUserData && currentUserData.usn) ? currentUserData.usn : (auth.currentUser.email || null);
      await addDoc(collection(db, routeCollection), {
        studentId: auth.currentUser.uid,
        usn: resolvedUsn,
        studentName: resolvedName,
        routeName,
        pickupPoint,
        year: profileType !== 'teacher' ? year : null,
        profileType,
        notes: notes || null,
        photoURL,
        paymentReceiptURL,
        requestDate: new Date(),
        status: "pending",
      });

      setSubmissionStatus("success");
  setRouteName("");
      setPickupPoint("");
      setYear("");
      setProfileType("student");
      setNotes("");
      setPhotoFile(null);
      setPhotoPreview(null);
      setPaymentReceiptFile(null);
      setPaymentReceiptPreview(null);
      setError(null);

      setTimeout(() => setSubmissionStatus(null), 5000);

    } catch (err) {
      setError("Failed to submit request: " + err.message);
      setSubmissionStatus("error");
    } finally {
      setUploading(false);
    }
  };

  if (loadingUserData) {
    return <div>Loading user information...</div>;
  }

  if (error && !submissionStatus) {
    return <div style={{ color: 'red', textAlign: "center" }}>Error: {error}</div>;
  }

  // Get pickup points for selected route
  const pickupOptions = routeName ? routeData[routeName] || [] : [];

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center',
      padding: window.innerWidth <= 768 ? '12px' : '20px'
    }}>
      <motion.div
        className="bus-pass-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ 
          maxWidth: 820,
          width: '100%',
          margin: window.innerWidth <= 768 ? '0' : 'auto'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center', 
          justifyContent: 'space-between', 
          marginBottom: 16,
          flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
          gap: window.innerWidth <= 480 ? '8px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="icon-badge-sm" style={{ background: 'rgba(24,25,63,0.08)', color: '#18193F' }}>
              <Bus size={18} />
            </span>
            <h2 style={{ 
              margin: 0,
              fontSize: window.innerWidth <= 768 ? '18px' : '22px'
            }}>Apply for Bus E-Pass</h2>
          </div>
          {currentUserData && (
            <span style={{ 
              fontSize: window.innerWidth <= 768 ? 11 : 12, 
              color: '#6b7280',
              textAlign: window.innerWidth <= 480 ? 'left' : 'right'
            }}>
              Logged in as {(currentUserData.name || currentUserData.fullName)} ({currentUserData.usn})
            </span>
          )}
        </div>

        {/* Highlights */}
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, margin: '0 0 14px 0', paddingLeft: 18, color: '#374151' }}>
          <li>Digital pass, campus-ready</li>
          <li>Curated routes with clear stops</li>
          <li>Fast approval by admin</li>
        </ul>

        {checkingApplications ? (
          <div style={{ padding: 12, textAlign: 'center' }}>Checking your existing bus pass applications...</div>
        ) : hasActiveApplication ? (
          <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ marginTop: 0 }}>You have an active application</h3>
            <div style={{ color: '#374151' }}>
              <p style={{ margin: '6px 0' }}>Status: <strong>{existingApplication?.status || '—'}</strong></p>
              <p style={{ margin: '6px 0' }}>Route: <strong>{existingApplication?.routeName || existingApplication?.routeCollection || '—'}</strong></p>
              {existingApplication?.requestDate && (
                <p style={{ margin: '6px 0' }}>Applied on: <strong>{(existingApplication.requestDate && existingApplication.requestDate.toDate) ? existingApplication.requestDate.toDate().toLocaleString() : (existingApplication.requestDate && existingApplication.requestDate.seconds ? new Date(existingApplication.requestDate.seconds * 1000).toLocaleString() : String(existingApplication.requestDate))}</strong></p>
              )}
              <div className="help-text">You cannot submit a new request while this application is pending or approved. Contact admin for changes.</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Route Dropdown */}
            <div className="field">
              <div className="label-row">
                <span className="icon-badge-sm icon-routes"><RouteIcon size={16} /></span>
                <label htmlFor="routeName">Select Route</label>
              </div>
              <select
                id="routeName"
                value={routeName}
                onChange={(e) => {
                  setRouteName(e.target.value);
                  setPickupPoint('');
                }}
                required
              >
                <option value="">-- Choose Route --</option>
                {Object.keys(routeData).map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
              <div className="help-text">Pick your bus corridor</div>
            </div>

            {/* Pickup Point Dropdown */}
            <div className="field">
              <div className="label-row">
                <span className="icon-badge-sm icon-tracking"><MapPin size={16} /></span>
                <label htmlFor="pickupPoint">Pickup Point</label>
              </div>
              <select
                id="pickupPoint"
                value={pickupPoint}
                onChange={(e) => setPickupPoint(e.target.value)}
                required
                disabled={!routeName}
              >
                <option value="">-- Choose Pickup Point --</option>
                {pickupOptions.map((point, idx) => (
                  <option key={idx} value={point}>
                    {point}
                  </option>
                ))}
              </select>
              <div className="help-text">This enables stop-wise scheduling</div>
            </div>

            {/* Year Dropdown (students only) */}
            {profileType !== 'teacher' && (
              <div className="field">
                <div className="label-row">
                  <span className="icon-badge-sm icon-epass"><GraduationCap size={16} /></span>
                  <label htmlFor="year">Year</label>
                </div>
                <select id="year" value={year} onChange={(e) => setYear(e.target.value)} required>
                  <option value="">-- Select Year --</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>
            )}

            {/* Profile Type */}
            <div className="field">
              <div className="label-row">
                <span className="icon-badge-sm icon-epass"><GraduationCap size={16} /></span>
                <label htmlFor="profileType">Profile Type</label>
              </div>
              <select id="profileType" value={profileType} onChange={(e) => {
                const v = e.target.value;
                setProfileType(v);
                if (v === 'teacher') setYear('');
              }} required>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              <div className="help-text">Choose who the pass is for</div>
            </div>

            {/* Photo Upload */}
            <div className="field">
              <div className="label-row">
                <span className="icon-badge-sm"><ImageIcon size={16} /></span>
                <label htmlFor="photoUpload">Upload Your Photo *</label>
              </div>
              <input 
                type="file" 
                id="photoUpload"
                accept="image/*"
                onChange={handlePhotoChange}
                required
                style={{ padding: '8px' }}
              />
              {photoPreview && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '150px', 
                      maxHeight: '150px', 
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb'
                    }} 
                  />
                </div>
              )}
              <div className="help-text">This photo will appear on your bus pass</div>
            </div>

            {/* Payment Receipt Upload (now required) */}
            <div className="field">
              <div className="label-row">
                <span className="icon-badge-sm"><Receipt size={16} /></span>
                <label htmlFor="receiptUpload">Upload Payment Receipt *</label>
              </div>
              <input 
                type="file" 
                id="receiptUpload"
                accept="image/*"
                onChange={handlePaymentReceiptChange}
                required
                style={{ padding: '8px' }}
              />
              {paymentReceiptPreview && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={paymentReceiptPreview} 
                    alt="Receipt Preview" 
                    style={{ 
                      maxWidth: '150px', 
                      maxHeight: '150px', 
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb'
                    }} 
                  />
                </div>
              )}
              <div className="help-text">Upload payment receipt for fee verification (required)</div>
            </div>

            {/* Notes */}
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="label-row">
                <span className="icon-badge-sm"><Bus size={16} /></span>
                <label htmlFor="notes">Notes (optional)</label>
              </div>
              <textarea id="notes" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions or details..." />
            </div>
          </div>

          <div className="form-actions">
            <motion.button 
              type="submit" 
              whileHover={{ scale: 1.01 }} 
              whileTap={{ scale: 0.99 }}
              disabled={uploading}
              style={{ opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? 'Uploading...' : 'Submit Request'}
            </motion.button>
          </div>
  </form>) }

        {submissionStatus === 'success' && (
          <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ color: 'green', marginTop: '10px' }}>✅ Request submitted successfully!</motion.p>
        )}
        {submissionStatus === 'error' && (
          <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ color: 'red', marginTop: '10px' }}>❌ Error: {error}</motion.p>
        )}
      </motion.div>
    </div>
  );
}

export default BusPassRequestForm;