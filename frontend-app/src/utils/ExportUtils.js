import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

// Export to CSV
export const exportToCSV = (data, filename = 'export') => {
  if (!data || data.length === 0) {
    alert('No data available for export');
    return;
  }

  try {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('CSV export error:', error);
    alert('CSV export failed. Please try again.');
  }
};

// Export to JSON
export const exportToJSON = (data, filename = 'export') => {
  if (!data || data.length === 0) {
    alert('No data available for export');
    return;
  }

  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('JSON export error:', error);
    alert('JSON export failed. Please try again.');
  }
};

// Export to HTML
export const exportToHTML = (data, filename = 'export', title = 'Data Export') => {
  if (!data || data.length === 0) {
    alert('No data available for export');
    return;
  }

  try {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }
        .meta {
            color: #666;
            margin-bottom: 20px;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #007bff;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ddd;
        }
        td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <div class="meta">
            Generated on: ${new Date().toLocaleString()}<br>
            Total Records: ${data.length}
        </div>
        <table>
            <thead>
                <tr>`;
    
    // Add headers
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    
    html += `
                </tr>
            </thead>
            <tbody>`;
    
    // Add data rows
    data.forEach(item => {
      html += '<tr>';
      headers.forEach(header => {
        const value = item[header] || '';
        html += `<td>${value}</td>`;
      });
      html += '</tr>';
    });
    
    html += `
            </tbody>
        </table>
        <div class="footer">
            <p>This report was generated on ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.html`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    console.error('HTML export error:', error);
    alert('HTML export failed. Please try again.');
  }
};

// Export to PDF with HTML fallback
export const exportToPDFWithFallback = (data, filename = 'export', title = 'Data Export') => {
  if (!data || data.length === 0) {
    alert('No data available for export');
    return;
  }

  try {
    // Import jsPDF dynamically
    import('jspdf').then((jsPDFModule) => {
      const { jsPDF } = jsPDFModule;
      
      // Import autoTable dynamically
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        // Add title
        doc.setFontSize(16);
        doc.text(title, 14, 15);
        
        // Add date
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
        
        // Prepare table data
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        const tableData = data.map(item => headers.map(header => String(item[header] || '')));
        
        // Add table
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 30,
          styles: {
            fontSize: 8,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
          },
          margin: { top: 30, left: 14, right: 14 },
        });
        
        // Save PDF
        doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      }).catch((error) => {
        console.error('AutoTable import error:', error);
        // Fallback to HTML export
        console.log('PDF failed, falling back to HTML export...');
        exportToHTML(data, filename, title);
      });
    }).catch((error) => {
      console.error('jsPDF import error:', error);
      // Fallback to HTML export
      console.log('PDF failed, falling back to HTML export...');
      exportToHTML(data, filename, title);
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    // Fallback to HTML export
    console.log('PDF failed, falling back to HTML export...');
    exportToHTML(data, filename, title);
  }
};

// Export complaints data with custom formatting
export const exportComplaintsData = (complaints, format, filename = 'complaints') => {
  // Transform complaints data for better export format
  const transformedData = complaints.map(complaint => ({
    'Complaint ID': complaint._id || 'N/A',
    'Title': complaint.title || 'N/A',
    'Description': complaint.description || 'N/A',
    'Category': complaint.category || 'N/A',
    'Status': complaint.status || 'N/A',
    'Priority': complaint.priority || 'N/A',
    'Created Date': complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A',
    'Updated Date': complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleDateString() : 'N/A',
    'Deadline': complaint.deadline ? new Date(complaint.deadline).toLocaleDateString() : 'N/A',
    'Assigned To': complaint.assigned_to?.username || 'Unassigned',
    'Submitted By': complaint.submitted_by?.username || 'N/A',
    'Location': complaint.location || 'N/A',
    'SLA Violation': complaint.slaViolation ? 'Yes' : 'No',
  }));

  switch (format.toLowerCase()) {
    case 'csv':
      exportToCSV(transformedData, filename);
      break;
    case 'json':
      exportToJSON(transformedData, filename);
      break;
    case 'pdf':
      exportToPDFWithFallback(transformedData, filename, 'Complaints Report');
      break;
    case 'html':
      exportToHTML(transformedData, filename, 'Complaints Report');
      break;
    default:
      alert('Invalid export format. Please choose CSV, JSON, PDF, or HTML.');
  }
};

// Export users data with custom formatting
export const exportUsersData = (users, format, filename = 'users') => {
  const transformedData = users.map(user => ({
    'User ID': user._id || 'N/A',
    'Username': user.username || 'N/A',
    'Email': user.email || 'N/A',
    'Role': user.role || 'N/A',
    'Created Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
    'Last Updated': user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A',
  }));

  switch (format.toLowerCase()) {
    case 'csv':
      exportToCSV(transformedData, filename);
      break;
    case 'json':
      exportToJSON(transformedData, filename);
      break;
    case 'pdf':
      exportToPDFWithFallback(transformedData, filename, 'Users Report');
      break;
    case 'html':
      exportToHTML(transformedData, filename, 'Users Report');
      break;
    default:
      alert('Invalid export format. Please choose CSV, JSON, PDF, or HTML.');
  }
};

// Export dashboard statistics
export const exportDashboardStats = (stats, format, filename = 'dashboard_stats') => {
  const statsData = [
    {
      'Metric': 'Total Complaints',
      'Value': stats.total || 0,
    },
    {
      'Metric': 'Open Complaints',
      'Value': stats.open || 0,
    },
    {
      'Metric': 'In Progress',
      'Value': stats.inProgress || 0,
    },
    {
      'Metric': 'Resolved',
      'Value': stats.resolved || 0,
    },
    {
      'Metric': 'Closed',
      'Value': stats.closed || 0,
    },
    {
      'Metric': 'SLA Violations',
      'Value': stats.slaViolations || 0,
    },
  ];

  switch (format.toLowerCase()) {
    case 'csv':
      exportToCSV(statsData, filename);
      break;
    case 'json':
      exportToJSON(statsData, filename);
      break;
    case 'pdf':
      exportToPDFWithFallback(statsData, filename, 'Dashboard Statistics');
      break;
    case 'html':
      exportToHTML(statsData, filename, 'Dashboard Statistics');
      break;
    default:
      alert('Invalid export format. Please choose CSV, JSON, PDF, or HTML.');
  }
};

// Export chart data
export const exportChartData = (chartData, format, filename = 'chart_data') => {
  if (!chartData || chartData.length === 0) {
    alert('No chart data available for export');
    return;
  }

  // Transform chart data for export
  const transformedData = chartData.map(item => ({
    'Date': item.date || 'N/A',
    'Daily Complaints': item.daily || 0,
    'Cumulative Complaints': item.cumulative || 0,
    'SLA Violations': item.slaViolations || 0,
    'Formatted Date': new Date(item.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }));

  switch (format.toLowerCase()) {
    case 'csv':
      exportToCSV(transformedData, filename);
      break;
    case 'json':
      exportToJSON(transformedData, filename);
      break;
    case 'pdf':
      exportToPDFWithFallback(transformedData, filename, 'Complaints Chart Data');
      break;
    case 'html':
      exportToHTML(transformedData, filename, 'Complaints Chart Data');
      break;
    default:
      alert('Invalid export format. Please choose CSV, JSON, PDF, or HTML.');
  }
};
