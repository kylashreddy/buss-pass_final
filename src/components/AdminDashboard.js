// src/components/AdminDashboard.js
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
// Ensure all necessary Firestore functions are imported
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore"; 

// Helper function to safely get Firestore reference
const getRequestRef = (routeCollection, requestId) => {
    // The collection name could be 'busPassRequests' OR 'route-X'
    return doc(db, routeCollection, requestId); 
}

function AdminDashboard({ filterProfileType = "all" }) {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showValidityModal, setShowValidityModal] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);

    useEffect(() => {
        // 🚀 FIX: Include the new centralized collection name
        const collectionsToMonitor = [
            "busPassRequests", // Centralized collection
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

                    // Update state, replacing old requests from this specific collection
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

    // Show approval modal with validity period options
    const handleApproveClick = (requestId, routeCollection) => {
        setCurrentRequest({ id: requestId, routeCollection });
        setShowValidityModal(true);
    };

    // Approve with custom validity period
    const handleApprove = async (requestId, routeCollection, validityDays = 365) => {
        try {
            const requestRef = getRequestRef(routeCollection, requestId); 
            
            // Calculate validity date based on custom period
            const approvalDate = new Date();
            const validUntil = new Date(approvalDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

            await updateDoc(requestRef, {
                status: "approved",
                adminId: auth.currentUser.uid,
                approvalDate: approvalDate,
                validUntil: validUntil,
                validityPeriod: validityDays, // Store the validity period for reference
            });

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
                approvalDate: new Date(), // Using approvalDate for timeline tracking
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

    // Reusable styles
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
                                        <td style={tdStyle}>{req.studentName}</td>
                                        <td style={tdStyle}>{req.usn}</td>
                                        <td style={tdStyle}>{req.routeName || req.routeCol}</td>
                                        <td style={tdStyle}>{req.pickupPoint}</td>
                                        <td style={tdStyle}>
                                            <span className={`badge ${req.status || 'pending'}`}>{(req.status || 'pending').toUpperCase()}</span>
                                        </td>
                                        <td style={tdStyle}>
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
                                <div style={{ marginBottom: "12px" }}>
                                    <h4 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>{req.studentName}</h4>
                                    <p style={{ margin: "0", color: "#6b7280", fontSize: "14px" }}>USN: {req.usn}</p>
                                </div>
                                
                                <div style={{ marginBottom: "12px", fontSize: "14px" }}>
                                    <div style={{ marginBottom: "4px" }}><strong>Route:</strong> {req.routeName || req.routeCol}</div>
                                    <div style={{ marginBottom: "4px" }}><strong>Pickup:</strong> {req.pickupPoint}</div>
                                    <div>
                                        <strong>Status:</strong> 
                                        <span className={`badge ${req.status || 'pending'}`} style={{ marginLeft: "8px" }}>                                            {(req.status || 'pending').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <button 
                                        className="btn-chip btn-approve" 
                                        onClick={() => handleApproveClick(req.id, req.routeCol)}
                                        style={{ flex: "1", minWidth: "120px" }}
                                    >
                                        <span className="dot" /> Approve
                                    </button>
                                    <button 
                                        className="btn-chip btn-reject" 
                                        onClick={() => handleReject(req.id, req.routeCol)}
                                        style={{ flex: "1", minWidth: "120px" }}
                                    >
                                        <span className="dot" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Validity Period Modal */}
            {showValidityModal && currentRequest && (
                <div className="modal-overlay">
                    <div className="modal" style={{ 
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

// Reusable styles (removed old inline button styles)
const thStyle = { padding: "10px", border: "1px solid #ddd", textAlign: "left" };
const tdStyle = { padding: "10px", border: "1px solid #ddd" };


export default AdminDashboard;