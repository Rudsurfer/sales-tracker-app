import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react'; // Optional: for a nice icon

// --- Helper Utilities ---

// Rudsak logo in Base64 format to embed directly into the PDF without needing an external file.
const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAbFBMVEX///8AAADc3Nytra38/PyysrKkpKTHx8fNzc2enp7q6ur19fXAwMCJiYnDw8O7u7vj4+Ourq55eXk/Pz+CgoLg4OCoqKhISEgZGRlSUlKqqqpwcHBEREQwMDBfX19bW1uZmZmAgIBPT0+PzL1UAAADh0lEQVR4nO2d63aqMBCFRyISFFFBERenbv//7ac3hSCkbrLdTObc5/uA5pkks64kAgAAAAAAAAAAAAAAAAAAAED/jGdmT8+PZzPpdJ6b1d4/ZlM2s9m01+s1I9l+1JftX+PTDrpD1b4j+vjA5V1F0+k4m82mXm8S9e8tYvSgacb9p0eYjPSpQ5W20+k0m83W63W/2dMjfE/cM8/3RFv6pCW/o+l0nEwms263u91umvXwFl8S7h7vKn2t1d/1j8bTaTQaxWKxWq3O57NpvLd4j3iX+F68S/xeXm0227Vare/5fJ7N4p3it+J94l3i/fG2/1g2m3U6nf7m3zKbhbeJ94l/S7x/fCg/mUwyvC7eJd4l3ide+7eMxuPxFItFt9ut1+t0Ol1e/m3F0/gWvCfeJd4n3iXeL77d+K3z+SyLxaJYLNbr9Z5PZ/E28b7xP/Ge8Wk8nUwmUavV/v3vL5/P4n3iXeL/xLvFp/He5bqu1+vNZvOr5/N5FItFp9Pp9XqL+K/Fp/FpPF58f91ut9vtdrvdbrVa7e/5t/JpvE+8S7xPvE+8v/h+Y7FYLBaLxWJRrVZ/828ZjyfeJ94nvk+8T7yveJ94n3if/5u8LzzPzGz5zIqZ+YyZ+U2v1/sLz76ZmXfMvGZmXjKzz8xs+f7t/xH+vM/MPGNm/jEz75h5w8y+YWbP/2/+R+Fv+vA8M/ORmWnmfMvM+UbMvGNm3s9/k/8R/lWf3zKzz8w+M/OXmX3LzP5hZt8w8+8y869l5l8y85eZ/cvM/uP/x/8I/5jP71l+P+T3w+8H3//r/c8q/yW/H/r7oY8f+vrR14/9/djHR3191NdHff3c1899/dzXx3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dzXR3393NdHff3c1899/dxf+D9mZk8AAAAAAAAAAAAAAAAAAAD+K78BF3U3g+S6YV4AAAAASUVORK5CYII=';

/**
 * Calculates the start and end dates for a given week number and year.
 * @param {number} week - The week number (1-53).
 * @param {number} year - The four-digit year.
 * @returns {string} - Formatted date range string (e.g., "Sep 28 - Oct 4, 2025").
 */
const getWeekDates = (week, year) => {
    const firstDayOfYear = new Date(year, 0, 1);
    const days = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
    const startDate = new Date(year, 0, days);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const options = { month: 'short', day: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', options);

    return `${startStr} - ${endStr}, ${year}`;
};

export const Schedule = ({ t, selectedStore, currentWeek, currentYear, API_BASE_URL, allEmployees }) => {
    const [schedule, setSchedule] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSchedule = async () => {
        if (!selectedStore) return;
        setIsLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`
            );
            if (!response.ok) throw new Error("Failed to fetch schedule");
            const data = await response.json();
            setSchedule(data);
        } catch (error) {
            console.error(error);
            setSchedule(null); // Clear previous schedule on error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [selectedStore, currentWeek, currentYear]);

    /**
     * Handles the PDF generation and download.
     */
    const handleDownloadPdf = async () => {
        if (!schedule || !schedule.details || schedule.details.length === 0) {
            alert("No schedule data available to generate a PDF.");
            return;
        }

        const doc = new window.jspdf.jsPDF();

        // --- 1. Calculate Data for PDF ---
        const totalScheduledHours = schedule.details.reduce((acc, row) => {
            const hours = parseFloat(row.ActualHours);
            return acc + (isNaN(hours) ? 0 : hours);
        }, 0);

        const weekDateRange = getWeekDates(currentWeek, currentYear);

        const tableHead = [['Employee', 'Shifts', 'Total Hours']];
        const tableBody = schedule.details.map(row => {
            const employee = allEmployees.find(e => e.EmployeeID === row.EmployeeID);
            return [
                employee ? employee.Name : 'Unknown Employee',
                row.Shifts || '',
                row.ActualHours || '0'
            ];
        });

        // --- 2. Generate PDF using AutoTable ---
        doc.autoTable({
            head: tableHead,
            body: tableBody,
            startY: 100, // Start table below the header
            theme: 'grid', // Use 'plain' or 'striped' for other looks
            headStyles: {
                fillColor: [41, 128, 185], // A professional blue
                textColor: 255,
                fontStyle: 'bold',
            },
            styles: {
                cellPadding: 5,
                fontSize: 9,
            },
            // The didDrawPage hook runs for every page, adding our header and footer
            didDrawPage: (data) => {
                // --- 3. Add Professional Header ---
                // Logo
                doc.addImage(logoBase64, 'PNG', data.settings.margin.left, 15, 60, 20);

                // Document Title
                doc.setFontSize(18);
                doc.setTextColor(40);
                doc.text('Weekly Schedule', data.settings.margin.left, 55);

                // Header Details
                doc.setFontSize(11);
                doc.text(`Store: ${selectedStore}`, data.settings.margin.left, 70);
                doc.text(`Week ${currentWeek}: ${weekDateRange}`, data.settings.margin.left, 80);


                // --- Footer ---
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 10, { align: 'right' });
            },
        });

        // --- 4. Add Summary Footer (on the last page) ---
        const finalY = doc.autoTable.previous.finalY; // Get Y position of the end of the table
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(
            'Total Scheduled Hours:',
            doc.internal.pageSize.width - 150,
            finalY + 25,
            { align: 'left' }
        );
        doc.text(
            `${totalScheduledHours.toFixed(2)}`,
            doc.internal.pageSize.width - doc.internal.pageSize.width / 5,
            finalY + 25,
            { align: 'left' }
        );


        // --- 5. Save the PDF ---
        doc.save(`Schedule_Store-${selectedStore}_W${currentWeek}_${currentYear}.pdf`);
    };

    // --- JSX Rendering ---
    return (
        <div>
            {/* Conditional Rendering based on loading and data state */}
            {isLoading ? (
                <p>Loading schedule...</p>
            ) : schedule && schedule.details && schedule.details.length > 0 ? (
                <div>
                    <button
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg mb-4 shadow-md transition-transform transform hover:scale-105"
                    >
                        <Download size={18} />
                        Download PDF
                    </button>

                    <div className="overflow-x-auto rounded-lg border border-gray-700">
                        <table className="min-w-full bg-gray-800 text-white">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left">Employee</th>
                                    <th className="px-4 py-3 text-left">Shifts</th>
                                    <th className="px-4 py-3 text-left">Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedule.details.map((row, index) => {
                                    const employee = allEmployees.find(e => e.EmployeeID === row.EmployeeID);
                                    return (
                                        <tr key={index} className="border-t border-gray-700 hover:bg-gray-700/50">
                                            <td className="px-4 py-2">{employee ? employee.Name : "Unknown"}</td>
                                            <td className="px-4 py-2 font-mono text-sm">{row.Shifts}</td>
                                            <td className="px-4 py-2">{row.ActualHours}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <p>No schedule data available for this week.</p>
            )}
        </div>
    );
};