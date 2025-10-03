// src/components/AllData.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore"; // ✅ Removed getCollections
import * as XLSX from "xlsx"; // For Excel export
import jsPDF from "jspdf";   // For PDF export
import "jspdf-autotable";    // For table support in PDF

function AllData() {
  const [routeData, setRouteData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllRoutes = async () => {
      try {
        // Define route collections manually (route-1 to route-12)
        const routeCollections = [...Array(12)].map((_, i) => `route-${i + 1}`);
        let dataByRoute = {};

        for (const route of routeCollections) {
          const snapshot = await getDocs(collection(db, route));
          dataByRoute[route] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        setRouteData(dataByRoute);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching route data:", error);
      }
    };

    fetchAllRoutes();
  }, []);

  // ✅ Export to Excel (route-wise sheets)
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    Object.keys(routeData).forEach((routeId) => {
      const data = routeData[routeId].map((req) => ({
        "Student Name": req.studentName,
        "USN": req.usn,
        "Pickup Point": req.pickupPoint,
        "Status": req.status,
        "Request Date": req.requestDate
          ? new Date(req.requestDate.seconds * 1000).toLocaleString()
          : "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, routeId.toUpperCase());
    });

    XLSX.writeFile(workbook, "BusPassRequests.xlsx");
  };

  // ✅ Export to PDF (route-wise tables)
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Bus Pass Requests - Route-wise Report", 14, 15);

    let yOffset = 30;

    Object.keys(routeData).forEach((routeId) => {
      doc.setFontSize(14);
      doc.text(routeId.toUpperCase(), 14, yOffset);

      const data = routeData[routeId].map((req) => [
        req.studentName,
        req.usn,
        req.pickupPoint,
        req.status,
        req.requestDate
          ? new Date(req.requestDate.seconds * 1000).toLocaleString()
          : "N/A",
      ]);

      doc.autoTable({
        startY: yOffset + 5,
        head: [["Student Name", "USN", "Pickup Point", "Status", "Request Date"]],
        body: data,
      });

      yOffset = doc.lastAutoTable.finalY + 15;
    });

    doc.save("BusPassRequests.pdf");
  };

  if (loading) return <p>Loading route data...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 All Bus Pass Requests (By Route)</h2>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={exportToExcel} style={{ marginRight: "10px" }}>
          📑 Export to Excel
        </button>
        <button onClick={exportToPDF}>📄 Export to PDF</button>
      </div>

      {Object.keys(routeData).length === 0 ? (
        <p>No route data found.</p>
      ) : (
        Object.keys(routeData).map((routeId) => (
          <div key={routeId} style={{ marginBottom: "40px" }}>
            <h3>{routeId.toUpperCase()}</h3>
            {routeData[routeId].length === 0 ? (
              <p>No requests for this route.</p>
            ) : (
              <table border="1" cellPadding="8" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>USN</th>
                    <th>Pickup Point</th>
                    <th>Status</th>
                    <th>Request Date</th>
                  </tr>
                </thead>
                <tbody>
                  {routeData[routeId].map((req) => (
                    <tr key={req.id}>
                      <td>{req.studentName}</td>
                      <td>{req.usn}</td>
                      <td>{req.pickupPoint}</td>
                      <td>{req.status}</td>
                      <td>
                        {req.requestDate
                          ? new Date(req.requestDate.seconds * 1000).toLocaleString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AllData;
