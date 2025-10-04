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
        let requests = [];
        for (const colId of COLLECTIONS_TO_FETCH) {
          const snapshot = await getDocs(collection(db, colId));
          snapshot.docs.forEach((doc) => {
            requests.push({
              id: doc.id,
              sourceCollection: colId,
              ...doc.data(),
            });
          });
        }
        setAllRequests(requests);
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
      <p style={{ textAlign: "center", padding: "20px" }}>
        Loading all data... ⏳
      </p>
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
        getSortedRoutes(filteredAndGroupedData).map(([routeId, data]) => {
          const cleanRouteName =
            routeId === "busPassRequests"
              ? "GENERAL"
              : `ROUTE ${routeId.replace("route-", "")}`;

          return (
            <div key={routeId} style={{ marginBottom: "30px" }}>
              <h3 style={{ margin: "10px 0", color: "#2563eb" }}>
                {cleanRouteName} ({data.length})
              </h3>

              {/* ✅ Responsive wrapper */}
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: "600px", // ✅ prevents squish
                    borderCollapse: "collapse",
                    background: "#fff",
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  <thead style={{ background: "#f3f3f3" }}>
                    <tr>
                      <th style={{ padding: "12px", border: "1px solid #ddd" }}>Name</th>
                      <th style={{ padding: "12px", border: "1px solid #ddd" }}>USN</th>
                      <th style={{ padding: "12px", border: "1px solid #ddd" }}>Profile</th>
                      <th style={{ padding: "12px", border: "1px solid #ddd" }}>Pickup Point</th>
                      <th style={{ padding: "12px", border: "1px solid #ddd" }}>Status</th>
                      <th style={{ padding: "12px", border: "1px solid #ddd" }}>Request Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((req) => (
                      <tr key={req.id}>
                        <td style={{ padding: "10px", border: "1px solid #ddd", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {req.studentName || "N/A"}
                        </td>
                        <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                          {req.usn || "N/A"}
                        </td>
                        <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                          {req.profileType || "Student"}
                        </td>
                        <td style={{ padding: "10px", border: "1px solid #ddd", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {req.pickupPoint || "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            border: "1px solid #ddd",
                            fontWeight: "bold",
                            color:
                              req.status === "approved"
                                ? "green"
                                : req.status === "pending"
                                ? "orange"
                                : "red",
                          }}
                        >
                          {(req.status || "pending").toUpperCase()}
                        </td>
                        <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                          {formatReqDate(req)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default AllData;
