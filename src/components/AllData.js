// src/components/AllData.js
import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ proper import
import { Filter, FileText, FileSpreadsheet } from "lucide-react";

const COLLECTIONS_TO_FETCH = [
  "busPassRequests",
  "route-1","route-2","route-3","route-4","route-5","route-6",
  "route-7","route-8","route-9","route-10","route-11","route-12"
];

// ✅ Format Firestore date
const formatReqDate = (req) => {
  if (req.requestDate) {
    const date = req.requestDate.toDate
      ? req.requestDate.toDate()
      : new Date(req.requestDate.seconds * 1000);
    return date.toLocaleDateString();
  }
  return "N/A";
};

function AllData() {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
  const fetchAllRequests = async () => {
    setLoading(true);
    try {
      // ✅ Fetch all collections in parallel
      const snapshots = await Promise.all(
        COLLECTIONS_TO_FETCH.map((colId) => getDocs(collection(db, colId)))
      );

      // ✅ Merge all documents
      const allData = snapshots.flatMap((snapshot, i) =>
        snapshot.docs.map((doc) => ({
          id: doc.id,
          sourceCollection: COLLECTIONS_TO_FETCH[i],
          ...doc.data(),
        }))
      );

      setAllRequests(allData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchAllRequests();
}, []);


  // ✅ Group by route
  const filteredAndGroupedData = useMemo(() => {
    let filtered = allRequests;
    if (filterType !== "all") {
      filtered = allRequests.filter(
        (req) => (req.profileType || "student") === filterType
      );
    }
    return filtered.reduce((acc, req) => {
      const routeKey = req.routeName ?? req.sourceCollection;
      if (!acc[routeKey]) acc[routeKey] = [];
      acc[routeKey].push(req);
      return acc;
    }, {});
  }, [allRequests, filterType]);

  // ✅ Numeric sort (busPassRequests always on top)
  const getSortedRoutes = (dataObj) => {
    return Object.entries(dataObj).sort(([a], [b]) => {
      if (a === "busPassRequests") return -1;
      if (b === "busPassRequests") return 1;
      const numA = parseInt(a.replace("route-", "")) || 0;
      const numB = parseInt(b.replace("route-", "")) || 0;
      return numA - numB;
    });
  };

  // ✅ Clean export date
  const formatExportDate = (req) =>
    req.requestDate
      ? req.requestDate.toDate
        ? req.requestDate.toDate().toLocaleString()
        : new Date(req.requestDate.seconds * 1000).toLocaleString()
      : "N/A";

  // ✅ Export Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    getSortedRoutes(filteredAndGroupedData).forEach(([routeId, data]) => {
      const cleanRouteName =
        routeId === "busPassRequests"
          ? "GENERAL"
          : `ROUTE ${routeId.replace("route-", "")}`;

      const sheetData = data.map((req) => ({
        "Student Name": req.studentName || "N/A",
        USN: req.usn || "N/A",
        "Profile Type": req.profileType || "Student",
        Route: cleanRouteName,
        "Pickup Point": req.pickupPoint || "N/A",
        Status: req.status || "pending",
        "Request Date": formatExportDate(req),
      }));

      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, cleanRouteName);
    });
    XLSX.writeFile(workbook, `BusPassRequests_${filterType.toUpperCase()}.xlsx`);
  };

  // ✅ Export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Bus Pass Report - ${filterType.toUpperCase()}`, 14, 15);
    let yOffset = 30;

    getSortedRoutes(filteredAndGroupedData).forEach(([routeId, data]) => {
      const cleanRouteName =
        routeId === "busPassRequests"
          ? "GENERAL"
          : `ROUTE ${routeId.replace("route-", "")}`;

      doc.setFontSize(14);
      doc.text(`${cleanRouteName} (${data.length})`, 14, yOffset);

      const tableData = data.map((req) => [
        req.studentName || "N/A",
        req.usn || "N/A",
        req.profileType || "Student",
        req.pickupPoint || "N/A",
        req.status || "pending",
        formatExportDate(req),
      ]);

      autoTable(doc, {
        startY: yOffset + 5,
        head: [["Name", "USN", "Profile", "Pickup Point", "Status", "Request Date"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59] },
      });

      yOffset = doc.lastAutoTable.finalY + 15;
      if (yOffset > 280) {
        doc.addPage();
        yOffset = 20;
      }
    });
    doc.save(`BusPassRequests_${filterType.toUpperCase()}.pdf`);
  };

 if (loading)
  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        padding: "30px",
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontWeight: "600",
          color: "#1e293b",
        }}
      >
        📊 Comprehensive Bus Pass Data
      </h2>

      {/* Filter bar skeleton */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "150px",
            height: "35px",
            borderRadius: "8px",
            background:
              "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
            backgroundSize: "200% 100%",
            animation: "skeletonLoading 1.6s infinite",
          }}
        ></div>
        <div style={{ display: "flex", gap: "10px" }}>
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              style={{
                width: "80px",
                height: "35px",
                borderRadius: "8px",
                background:
                  "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
                backgroundSize: "200% 100%",
                animation: "skeletonLoading 1.6s infinite",
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Multiple fake route sections */}
      {[...Array(3)].map((_, sectionIndex) => (
        <div
          key={sectionIndex}
          style={{
            marginBottom: "35px",
            borderRadius: "12px",
            padding: "15px",
            backgroundColor: "#ffffff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          {/* Route Title */}
          <div
            style={{
              height: "22px",
              width: "180px",
              marginBottom: "15px",
              borderRadius: "6px",
              background:
                "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
              backgroundSize: "200% 100%",
              animation: "skeletonLoading 1.6s infinite",
            }}
          ></div>

          {/* Table skeleton header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: "18px",
                  borderRadius: "6px",
                  background:
                    "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
                  backgroundSize: "200% 100%",
                  animation: "skeletonLoading 1.6s infinite",
                }}
              ></div>
            ))}
          </div>

          {/* Table rows */}
          {[...Array(3)].map((_, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: "20px",
                    borderRadius: "6px",
                    background:
                      "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
                    backgroundSize: "200% 100%",
                    animation: "skeletonLoading 1.6s infinite",
                  }}
                ></div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* Text below */}
      <p style={{ textAlign: "center", color: "#64748b", marginTop: "20px" }}>
        Loading data...
      </p>

      {/* Animation keyframes */}
      <style>
        {`
          @keyframes skeletonLoading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );


  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
        📊 Comprehensive Bus Pass Data
      </h2>

      {/* Filter + Export Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <label className="fw-bold me-2">
            <Filter size={16} className="me-1" /> Filter:
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            <option value="all">All</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
          </select>
        </div>

        <div>
          <button
            onClick={exportToExcel}
            style={{
              padding: "6px 12px",
              marginRight: "10px",
              border: "none",
              borderRadius: "6px",
              background: "#107c10",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <FileSpreadsheet size={16} className="me-1" /> Excel
          </button>
          <button
            onClick={exportToPDF}
            style={{
              padding: "6px 12px",
              border: "none",
              borderRadius: "6px",
              background: "#b30000",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <FileText size={16} className="me-1" /> PDF
          </button>
        </div>
      </div>

      {/* Summary */}
      <p
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontWeight: "bold",
        }}
      >
        Showing {Object.values(filteredAndGroupedData).flat().length} requests
        across {Object.keys(filteredAndGroupedData).length} routes (
        {filterType.toUpperCase()}).
      </p>

      {/* Data Tables */}
      {Object.keys(filteredAndGroupedData).length === 0 ? (
        <p style={{ textAlign: "center" }}>
          No requests match the current filter.
        </p>
      ) : (
        <>
          {getSortedRoutes(filteredAndGroupedData).map(([routeId, data]) => {
            const cleanRouteName =
              routeId === "busPassRequests"
                ? "GENERAL"
                : `ROUTE ${routeId.replace("route-", "")}`;

            return (
              <div key={routeId} style={{ marginBottom: "30px" }}>
                <h3 style={{ margin: "10px 0", color: "#2563eb" }}>
                  {cleanRouteName} ({data.length})
                </h3>

                <div style={{ overflowX: "auto" }}>
                  <div className="table-wrapper">
                    <table className="ui-table" style={{ minWidth: "860px" }}>
                      <thead>
                        <tr>
                          <th className="col-name">Name</th>
                          <th className="col-usn">USN</th>
                          <th className="col-profile">Profile</th>
                          <th className="col-pickup">Pickup Point</th>
                          <th className="col-status">Status</th>
                          <th className="col-date">Request Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((req) => (
                          <tr key={req.id}>
                            <td className="col-name truncate">{req.studentName || "N/A"}</td>
                            <td className="col-usn">{req.usn || "N/A"}</td>
                            <td className="col-profile">{req.profileType || "Student"}</td>
                            <td className="col-pickup truncate">{req.pickupPoint || "N/A"}</td>
                            <td className="col-status">
                              <span className={`badge ${req.status || 'pending'}`}>{(req.status || 'pending').toUpperCase()}</span>
                            </td>
                            <td className="col-date">{formatReqDate(req)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default AllData;
