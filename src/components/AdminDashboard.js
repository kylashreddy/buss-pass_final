// src/components/AdminDashboard.js
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, setDoc, serverTimestamp, getDocs } from "firebase/firestore"; 

// Helper function to safely get Firestore reference
const getRequestRef = (routeCollection, requestId) => {
    return doc(db, routeCollection, requestId); 
}

function AdminDashboard({ filterProfileType = "all" }) {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showValidityModal, setShowValidityModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => {
        const collectionsToMonitor = [
            "busPassRequests",
            "route-1","route-2","route-3","route-4","route-5","route-6",
            "route-7","route-8","route-9","route-10","route-11","route-12"
        ];

        const unsubscribes = [];

        collectionsToMonitor.forEach((routeCol) => {
            const conditions = [where("status", "==", "pending")];
            if (filterProfileType && filterProfileType !== "all") {
                conditions.push(where("profileType", "==", filterProfileType));
            }
            const q = query(collection(db, routeCol), ...conditions);

            const unsubscribe = onSnapshot(
                q,
                (querySnapshot) => {
                    const requests = [];
                    querySnapshot.forEach((docSnap) => {
                        requests.push({ id: docSnap.id, routeCol, ...docSnap.data() });
                    });

                    setPendingRequests((prev) => {
                        const filteredPrev = prev.filter((r) => r.routeCol !== routeCol);
                        return [...filteredPrev, ...requests];
                    });
                    setLoading(false);
                },
                (err) => {
                    console.error("Error fetching requests:", err);
                    setError("Failed to load requests: " + err.message);
                    setLoading(false);
                }
            );

            unsubscribes.push(unsubscribe);
        });

        return () => unsubscribes.forEach((unsub) => unsub());
    }, [filterProfileType]);

    // Show request details with photo
    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setShowDetailsModal(true);
    };

    // Show approval modal with validity period options
    const handleApproveClick = (requestId, routeCollection) => {
        setCurrentRequest({ id: requestId, routeCollection });
        setShowValidityModal(true);
    };

    // Approve with custom validity period
    const handleApprove = async (requestId, routeCollection, validityDays = 365) => {
        try {
            const requestRef = getRequestRef(routeCollection, requestId); 
            
            const approvalDate = new Date();
            const validUntil = new Date(approvalDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

            await updateDoc(requestRef, {
                status: "approved",
                adminId: auth.currentUser.uid,
                approvalDate: approvalDate,
                validUntil: validUntil,
                validityPeriod: validityDays,
            });

            // If this request is for a teacher profile, ensure a users doc exists/updated
            try {
                const reqSnap = await getDoc(requestRef);
                const reqData = reqSnap.exists() ? reqSnap.data() : null;
                if (reqData && reqData.profileType === 'teacher') {
                    const applicantUid = reqData.studentId || reqData.studentUID || reqData.userId || null;
                    if (applicantUid) {
                        const userRef = doc(db, 'users', applicantUid);
                        // Try to preserve an existing email if the user doc already exists
                        let emailToWrite = reqData.email || reqData.contactEmail || '';
                        try {
                            const existingUserSnap = await getDoc(userRef);
                            if (existingUserSnap.exists()) {
                                const eu = existingUserSnap.data();
                                if (eu && eu.email) emailToWrite = eu.email;
                            }
                        } catch (readErr) {
                            console.warn('Could not read existing user doc for email preservation:', readErr);
                        }

                        // Create or update the user document to ensure they appear in admin users (role: teacher)
                        await setDoc(userRef, {
                            email: emailToWrite,
                            name: reqData.studentName || reqData.name || '',
                            usn: reqData.usn || null,
                            role: 'teacher',
                            updatedAt: serverTimestamp(),
                            createdAt: reqData.requestDate || serverTimestamp()
                        }, { merge: true });
                    } else {
                        console.warn('Approved teacher request has no applicant UID; cannot create users doc. Request:', requestId);
                    }
                }
            } catch (userErr) {
                console.error('Failed to ensure user document for approved teacher:', userErr);
            }

            alert(`✅ Request approved! Valid for ${validityDays} days until ${validUntil.toLocaleDateString()}`);
            setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
            setShowValidityModal(false);
            setCurrentRequest(null);
        } catch (err) {
            console.error("Error approving request:", err);
            setError("Failed to approve: " + err.message);
        }
    };

    const handleReject = async (requestId, routeCollection) => {
        const reason = prompt("Enter reason for rejection (optional):");
        try {
            const requestRef = getRequestRef(routeCollection, requestId);
            await updateDoc(requestRef, {
                status: "rejected",
                adminId: auth.currentUser.uid,
                approvalDate: new Date(),
                rejectionReason: reason || "No reason provided",
            });
            alert("❌ Request rejected!");
            setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        } catch (err) {
            console.error("Error rejecting request:", err);
            setError("Failed to reject: " + err.message);
        }
    };

    if (loading) return <p>Loading requests...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    const label =
        filterProfileType === "student"
            ? "Students"
            : filterProfileType === "teacher"
                ? "Teachers"
                : "All Profiles";

    const thStyle = { padding: "10px", border: "1px solid #ddd", textAlign: "left" };
    const tdStyle = { padding: "10px", border: "1px solid #ddd" };

    return (
        <div style={{ padding: window.innerWidth <= 768 ? "12px" : "20px", maxWidth: "100%", overflow: "hidden" }}>
            <h2 style={{ 
                marginBottom: "6px", 
                textAlign: "center",
                fontSize: window.innerWidth <= 768 ? "18px" : "22px"
            }}>📋 Pending Bus Pass Requests</h2>
            <p style={{ marginTop: 0, textAlign: "center", color: "#6b7280" }}>Filter: {label}</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn-chip" onClick={async () => {
                    if (!window.confirm('Backfill approved teacher accounts into users collection? This will create/update user docs for approved teacher requests.')) return;
                    try {
                        const collectionsToScan = [
                            "busPassRequests",
                            "route-1","route-2","route-3","route-4","route-5","route-6",
                            "route-7","route-8","route-9","route-10","route-11","route-12"
                        ];
                        let processed = 0;
                        for (const col of collectionsToScan) {
                            const q = query(collection(db, col), where('status', '==', 'approved'), where('profileType', '==', 'teacher'));
                            const snap = await getDocs(q);
                            for (const docSnap of snap.docs) {
                                const data = docSnap.data();
                                const uid = data.studentId || data.studentUID || data.userId || null;
                                if (!uid) continue;
                                const userRef = doc(db, 'users', uid);
                                let emailToWrite = data.email || '';
                                try {
                                    const existing = await getDoc(userRef);
                                    if (existing.exists()) {
                                        const ex = existing.data();
                                        if (ex && ex.email) emailToWrite = ex.email;
                                    }
                                } catch (re) {
                                    console.warn('Could not read existing user during backfill:', re);
                                }
                                await setDoc(userRef, {
                                    email: emailToWrite,
                                    name: data.studentName || data.name || data.fullName || '',
                                    usn: data.usn || null,
                                    role: 'teacher',
                                    updatedAt: serverTimestamp(),
                                    createdAt: data.requestDate || serverTimestamp()
                                }, { merge: true });
                                processed++;
                            }
                        }
                        alert(`Backfill complete. Processed ${processed} teacher(s).`);
                    } catch (err) {
                        console.error('Backfill failed:', err);
                        alert('Backfill failed: ' + err.message);
                    }
                    }} style={{ marginBottom: 8 }}>
                        Backfill Approved Teachers
                    </button>

                    {/* Backfill Students Button */}
                    <button className="btn-chip" onClick={async () => {
                        if (!window.confirm('Backfill approved student accounts into users collection? This will create/update user docs for approved student requests.')) return;
                        try {
                            const collectionsToScan = [
                                "busPassRequests",
                                "route-1","route-2","route-3","route-4","route-5","route-6",
                                "route-7","route-8","route-9","route-10","route-11","route-12"
                            ];
                            let processed = 0;
                            for (const col of collectionsToScan) {
                                const q = query(collection(db, col), where('status', '==', 'approved'), where('profileType', '==', 'student'));
                                const snap = await getDocs(q);
                                for (const docSnap of snap.docs) {
                                    const data = docSnap.data();
                                    const uid = data.studentId || data.studentUID || data.userId || null;
                                    if (!uid) continue;
                                    const userRef = doc(db, 'users', uid);
                                    let emailToWrite = data.email || '';
                                    try {
                                        const existing = await getDoc(userRef);
                                        if (existing.exists()) {
                                            const ex = existing.data();
                                            if (ex && ex.email) emailToWrite = ex.email;
                                        }
                                    } catch (re) {
                                        console.warn('Could not read existing user during backfill (student):', re);
                                    }
                                    await setDoc(userRef, {
                                        email: emailToWrite,
                                        name: data.studentName || data.name || data.fullName || '',
                                        usn: data.usn || null,
                                        role: 'student',
                                        updatedAt: serverTimestamp(),
                                        createdAt: data.requestDate || serverTimestamp()
                                    }, { merge: true });
                                    processed++;
                                }
                            }
                            alert(`Backfill complete. Processed ${processed} student(s).`);
                        } catch (err) {
                            console.error('Backfill failed (student):', err);
                            alert('Backfill failed: ' + err.message);
                        }
                    }} style={{ marginBottom: 8 }}>
                        Backfill Approved Students
                    </button>
                </div>
            </div>
            {pendingRequests.length === 0 ? (
                <p style={{ textAlign: "center" }}>No pending requests 🎉</p>
            ) : (
                <div style={{ 
                    overflowX: "auto", 
                    marginTop: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                }}>
                    {/* Desktop Table View */}
                    <div style={{ display: window.innerWidth > 768 ? "block" : "none" }}>
                        <table className="ui-table gray" style={{ minWidth: "1000px", width: "100%" }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Photo</th>
                                    <th style={thStyle}>Name</th>
                                    <th style={thStyle}>USN</th>
                                    <th style={thStyle}>Route</th>
                                    <th style={thStyle}>Pickup Point</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingRequests.map((req) => (
                                    <tr key={req.id}>
                                        <td style={tdStyle}>
                                            {req.photoURL ? (
                                                <img 
                                                    src={req.photoURL} 
                                                    alt="Student" 
                                                    style={{ 
                                                        width: 50, 
                                                        height: 50, 
                                                        objectFit: 'cover', 
                                                        borderRadius: '8px',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => handleViewDetails(req)}
                                                />
                                            ) : (
                                                <div style={{ 
                                                    width: 50, 
                                                    height: 50, 
                                                    background: '#e5e7eb', 
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    color: '#6b7280'
                                                }}>
                                                    No photo
                                                </div>
                                            )}
                                        </td>
                                        <td style={tdStyle}>{req.studentName}</td>
                                        <td style={tdStyle}>{req.usn}</td>
                                        <td style={tdStyle}>{req.routeName || req.routeCol}</td>
                                        <td style={tdStyle}>{req.pickupPoint}</td>
                                        <td style={tdStyle}>
                                            <span className={`badge ${req.status || 'pending'}`}>{(req.status || 'pending').toUpperCase()}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <button 
                                                className="btn-chip" 
                                                onClick={() => handleViewDetails(req)}
                                                style={{ marginRight: 8, background: '#3b82f6', color: 'white' }}
                                            >
                                                View Details
                                            </button>
                                            <button className="btn-chip btn-approve" onClick={() => handleApproveClick(req.id, req.routeCol)}>
                                                <span className="dot" /> Approve
                                            </button>
                                            <button className="btn-chip btn-reject" style={{ marginLeft: 8 }} onClick={() => handleReject(req.id, req.routeCol)}>
                                                <span className="dot" /> Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div style={{ display: window.innerWidth <= 768 ? "block" : "none" }}>
                        {pendingRequests.map((req) => (
                            <div key={req.id} style={{
                                padding: "16px",
                                borderBottom: "1px solid #e5e7eb",
                                background: "#fff"
                            }}>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                    {req.photoURL ? (
                                        <img 
                                            src={req.photoURL} 
                                            alt="Student" 
                                            style={{ 
                                                width: 60, 
                                                height: 60, 
                                                objectFit: 'cover', 
                                                borderRadius: '8px',
                                                flexShrink: 0
                                            }}
                                        />
                                    ) : (
                                        <div style={{ 
                                            width: 60, 
                                            height: 60, 
                                            background: '#e5e7eb', 
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '10px',
                                            color: '#6b7280',
                                            flexShrink: 0
                                        }}>
                                            No photo
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>{req.studentName}</h4>
                                        <p style={{ margin: "0", color: "#6b7280", fontSize: "14px" }}>USN: {req.usn}</p>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: "12px", fontSize: "14px" }}>
                                    <div style={{ marginBottom: "4px" }}><strong>Route:</strong> {req.routeName || req.routeCol}</div>
                                    <div style={{ marginBottom: "4px" }}><strong>Pickup:</strong> {req.pickupPoint}</div>
                                    <div>
                                        <strong>Status:</strong> 
                                        <span className={`badge ${req.status || 'pending'}`} style={{ marginLeft: "8px" }}>
                                            {(req.status || 'pending').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <button 
                                        className="btn-chip" 
                                        onClick={() => handleViewDetails(req)}
                                        style={{ flex: "1", minWidth: "100px", background: '#3b82f6', color: 'white' }}
                                    >
                                        View Details
                                    </button>
                                    <button 
                                        className="btn-chip btn-approve" 
                                        onClick={() => handleApproveClick(req.id, req.routeCol)}
                                        style={{ flex: "1", minWidth: "100px" }}
                                    >
                                        <span className="dot" /> Approve
                                    </button>
                                    <button 
                                        className="btn-chip btn-reject" 
                                        onClick={() => handleReject(req.id, req.routeCol)}
                                        style={{ flex: "1", minWidth: "100px" }}
                                    >
                                        <span className="dot" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Request Details Modal */}
            {showDetailsModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ 
                        maxWidth: 600,
                        width: window.innerWidth <= 768 ? "calc(100vw - 32px)" : "600px",
                        margin: window.innerWidth <= 768 ? "16px" : "auto",
                        maxHeight: "calc(100vh - 32px)",
                        overflowY: "auto"
                    }}>
                        <div className="modal-header">
                            <h3>Bus Pass Request Details</h3>
                        </div>
                        <div className="modal-body">
                            {/* Student Photo */}
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                {selectedRequest.photoURL ? (
                                    <img 
                                        src={selectedRequest.photoURL} 
                                        alt="Student" 
                                        style={{ 
                                            maxWidth: '200px',
                                            maxHeight: '200px',
                                            objectFit: 'cover',
                                            borderRadius: '12px',
                                            border: '3px solid #e5e7eb'
                                        }}
                                    />
                                ) : (
                                    <div style={{ 
                                        width: '200px',
                                        height: '200px',
                                        background: '#e5e7eb',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto',
                                        color: '#6b7280'
                                    }}>
                                        No Photo Uploaded
                                    </div>
                                )}
                            </div>

                            {/* Student Details */}
                            <div style={{ 
                                background: '#f9fafb', 
                                padding: '16px', 
                                borderRadius: '8px',
                                marginBottom: '16px'
                            }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <strong style={{ color: '#6b7280' }}>Name:</strong>
                                    <div style={{ fontSize: '18px', marginTop: '4px' }}>{selectedRequest.studentName}</div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <strong style={{ color: '#6b7280' }}>USN:</strong>
                                    <div style={{ fontSize: '16px', marginTop: '4px' }}>{selectedRequest.usn}</div>
                                </div>
                                {selectedRequest.year && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <strong style={{ color: '#6b7280' }}>Year:</strong>
                                        <div style={{ fontSize: '16px', marginTop: '4px' }}>{selectedRequest.year}</div>
                                    </div>
                                )}
                                <div style={{ marginBottom: '12px' }}>
                                    <strong style={{ color: '#6b7280' }}>Profile Type:</strong>
                                    <div style={{ fontSize: '16px', marginTop: '4px', textTransform: 'capitalize' }}>
                                        {selectedRequest.profileType || 'Student'}
                                    </div>
                                </div>
                            </div>

                            {/* Route Details */}
                            <div style={{ 
                                background: '#f0f9ff', 
                                padding: '16px', 
                                borderRadius: '8px',
                                marginBottom: '16px'
                            }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <strong style={{ color: '#1e40af' }}>Route:</strong>
                                    <div style={{ fontSize: '16px', marginTop: '4px' }}>
                                        {selectedRequest.routeName || selectedRequest.routeCol}
                                    </div>
                                </div>
                                <div>
                                    <strong style={{ color: '#1e40af' }}>Pickup Point:</strong>
                                    <div style={{ fontSize: '16px', marginTop: '4px' }}>{selectedRequest.pickupPoint}</div>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedRequest.notes && (
                                <div style={{ 
                                    background: '#fef3c7', 
                                    padding: '16px', 
                                    borderRadius: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <strong style={{ color: '#92400e' }}>Notes:</strong>
                                    <div style={{ fontSize: '14px', marginTop: '4px', color: '#78350f' }}>
                                        {selectedRequest.notes}
                                    </div>
                                </div>
                            )}

                            {/* Payment Receipt */}
                            {selectedRequest.paymentReceiptURL && (
                                <div style={{ marginTop: 20 }}>
                                    <strong style={{ display: 'block', marginBottom: '8px' }}>Payment Receipt:</strong>
                                    <img 
                                        src={selectedRequest.paymentReceiptURL} 
                                        alt="Payment Receipt" 
                                        style={{ 
                                            maxWidth: '100%',
                                            maxHeight: '300px',
                                            objectFit: 'contain',
                                            borderRadius: '8px',
                                            border: '2px solid #e5e7eb'
                                        }}
                                    />
                                </div>
                            )}

                            {/* Request Date */}
                            <div style={{ 
                                marginTop: '16px', 
                                paddingTop: '16px', 
                                borderTop: '1px solid #e5e7eb',
                                fontSize: '14px',
                                color: '#6b7280'
                            }}>
                                <strong>Request Date:</strong> {selectedRequest.requestDate?.toDate?.().toLocaleString() || 'N/A'}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="btn-chip btn-approve"
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    handleApproveClick(selectedRequest.id, selectedRequest.routeCol);
                                }}
                            >
                                <span className="dot" /> Approve Request
                            </button>
                            <button 
                                className="btn-chip btn-reject"
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    handleReject(selectedRequest.id, selectedRequest.routeCol);
                                }}
                            >
                                <span className="dot" /> Reject Request
                            </button>
                            <button 
                                className="btn-chip"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Validity Period Modal */}
            {showValidityModal && currentRequest && (
                <div className="modal-overlay" onClick={() => setShowValidityModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ 
                        maxWidth: 500,
                        width: window.innerWidth <= 768 ? "calc(100vw - 32px)" : "500px",
                        margin: window.innerWidth <= 768 ? "16px" : "auto",
                        maxHeight: "calc(100vh - 32px)",
                        overflowY: "auto"
                    }}>
                        <div className="modal-header">
                            <h3>Set Validity Period</h3>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: 20, color: '#6b7280' }}>
                                Choose how long this bus pass should be valid:
                            </p>
                            
                            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                                {[
                                    { label: '30 Days (1 Month)', days: 30 },
                                    { label: '90 Days (3 Months)', days: 90 },
                                    { label: '180 Days (6 Months)', days: 180 },
                                    { label: '365 Days (1 Year)', days: 365 },
                                    { label: '730 Days (2 Years)', days: 730 }
                                ].map(option => {
                                    const expiryDate = new Date(Date.now() + option.days * 24 * 60 * 60 * 1000);
                                    return (
                                        <button
                                            key={option.days}
                                            onClick={() => handleApprove(currentRequest.id, currentRequest.routeCollection, option.days)}
                                            className="btn-chip btn-approve"
                                            style={{
                                                width: '100%',
                                                justifyContent: 'space-between',
                                                padding: '12px 16px'
                                            }}
                                        >
                                            <span>{option.label}</span>
                                            <span style={{ fontSize: 12, opacity: 0.8 }}>
                                                Until {expiryDate.toLocaleDateString()}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <div style={{ 
                                background: '#f3f4f6', 
                                padding: 12, 
                                borderRadius: 8,
                                fontSize: 14,
                                color: '#4b5563'
                            }}>
                                <strong>Custom Period:</strong> For custom validity periods, contact the system administrator.
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="btn-chip"
                                onClick={() => {
                                    setShowValidityModal(false);
                                    setCurrentRequest(null);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;