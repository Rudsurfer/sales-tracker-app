import React, { useEffect, useState } from "react";
import { rudsakLogoBase64 } from "../assets/rudsakLogoBase64";

export const Schedule = ({ t, selectedStore, currentWeek, currentYear, API_BASE_URL, allEmployees }) => {
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    if (selectedStore) {
      fetchSchedule();
    }
  }, [selectedStore, currentWeek, currentYear]);

  const fetchSchedule = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`
      );
      if (!response.ok) throw new Error("Failed to fetch schedule");
      const data = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadPdf = async () => {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const lineHeight = 20;

    let y = margin;

    // Add logo
    const imgProps = {
      x: margin,
      y: y,
      width: 100,
      height: 40,
    };
    doc.addImage(rudsakLogoBase64, "PNG", imgProps.x, imgProps.y, imgProps.width, imgProps.height);

    y += imgProps.height + 20;

    // Title
    doc.setFontSize(14);
    doc.text(
      `Schedule - Store ${selectedStore} | Week ${currentWeek}, ${currentYear}`,
      margin,
      y
    );

    y += 30;
    doc.setFontSize(10);

    if (!schedule || !schedule.details) {
      doc.text("No schedule data available.", margin, y);
    } else {
      // Table Header
      doc.setFont(undefined, "bold");
      doc.text("Employee", margin, y);
      doc.text("Shifts", margin + 200, y);
      doc.text("Hours", margin + 400, y);
      doc.setFont(undefined, "normal");

      y += lineHeight;

      schedule.details.forEach((row, index) => {
        const employee = allEmployees.find(e => e.EmployeeID === row.EmployeeID);
        const name = employee ? employee.Name : "Unknown";

        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }

        doc.text(name, margin, y);
        doc.text(row.Shifts || "", margin + 200, y);
        doc.text(row.ActualHours || "", margin + 400, y);

        y += lineHeight;
      });
    }

    // Footer
    y = doc.internal.pageSize.getHeight() - margin;
    doc.setFontSize(10);
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      margin,
      y
    );

    doc.save(`schedule_${selectedStore}_week${currentWeek}_${currentYear}.pdf`);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Schedule</h2>
      {schedule ? (
        <div>
          <button
            onClick={handleDownloadPdf}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4"
          >
            Download PDF
          </button>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 text-white border border-gray-600">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Employee</th>
                  <th className="border px-4 py-2">Shifts</th>
                  <th className="border px-4 py-2">Hours</th>
                </tr>
              </thead>
              <tbody>
                {schedule.details.map((row, index) => {
                  const employee = allEmployees.find(e => e.EmployeeID === row.EmployeeID);
                  return (
                    <tr key={index}>
                      <td className="border px-4 py-2">{employee ? employee.Name : "Unknown"}</td>
                      <td className="border px-4 py-2">{row.Shifts}</td>
                      <td className="border px-4 py-2">{row.ActualHours}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p>Loading schedule...</p>
      )}
    </div>
  );
};
