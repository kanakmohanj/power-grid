import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot
} from 'recharts';
import { exportChartData } from '../utils/ExportUtils';

const ComplaintsChart = ({ complaints = [], onExport }) => {
  const chartRef = useRef(null);
  const [selectedRange, setSelectedRange] = useState('all');
  const [zoomDomain, setZoomDomain] = useState(null);
  const [hoveredData, setHoveredData] = useState(null);

  // Transform complaints data to cumulative format
  const transformData = (complaintsList, range) => {
    if (!complaintsList.length) return [];

    const sorted = [...complaintsList].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    const now = new Date();
    let startDate = new Date(sorted[0]?.createdAt || now);
    
    // Apply date range filter
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3mo':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1yr':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        // For 'all', use the earliest complaint date
        break;
    }

    // Get all complaints up to the end date for proper cumulative calculation
    const endDate = new Date(now);
    const allRelevantComplaints = sorted.filter(c => 
      new Date(c.createdAt) <= endDate && new Date(c.createdAt) >= startDate
    );

    // Group by date and calculate daily counts
    const dailyMap = {};
    allRelevantComplaints.forEach(complaint => {
      const date = new Date(complaint.createdAt).toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });

    // Generate all dates in range to fill gaps
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate cumulative counts
    let cumulative = 0;
    return dates.map(date => {
      cumulative += dailyMap[date] || 0;
      return {
        date,
        daily: dailyMap[date] || 0,
        cumulative,
        // Find SLA violations for this date
        slaViolations: allRelevantComplaints.filter(c => 
          new Date(c.createdAt).toISOString().split('T')[0] === date &&
          c.deadline && new Date(c.deadline) < new Date(c.resolvedAt || now)
        ).length
      };
    });
  };

  const data = transformData(complaints, selectedRange);
  const maxCumulative = Math.max(...data.map(d => d.cumulative), 0);

  // Debug logs to help troubleshoot
  useEffect(() => {
    console.log('ComplaintsChart - Selected range:', selectedRange);
    console.log('ComplaintsChart - Total complaints:', complaints.length);
    console.log('ComplaintsChart - Transformed data points:', data.length);
    console.log('ComplaintsChart - Max cumulative:', maxCumulative);
  }, [selectedRange, complaints, data, maxCumulative]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    const dateObj = new Date(data.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });

    return (
      <div className="bg-[#0B0D10]/90 backdrop-blur-xl border border-white/10 rounded-lg p-4 shadow-2xl">
        <div className="text-yellow-400 font-bold text-sm mb-2">{formattedDate}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-white text-sm">Total: </span>
            <span className="text-yellow-400 font-bold">{data.cumulative}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
            <span className="text-white text-sm">Daily: </span>
            <span className="text-cyan-400 font-bold">+{data.daily}</span>
          </div>
          {data.slaViolations > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-white text-sm">SLA Violations: </span>
              <span className="text-red-400 font-bold">{data.slaViolations}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Export functionality
  const handleExport = async (format) => {
    if (!chartRef.current) {
      alert('Chart not available for export');
      return;
    }

    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      // Wait longer for animations to complete and chart to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the specific chart container
      const chartElement = chartRef.current.querySelector('.recharts-wrapper') || chartRef.current;
      
      // Check if element has dimensions
      const rect = chartElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        throw new Error('Chart element has no dimensions');
      }
      
      console.log('Chart element dimensions:', rect.width, 'x', rect.height);
      
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#050607',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: rect.width,
        height: rect.height,
        windowWidth: rect.width,
        windowHeight: rect.height,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0
      });

      if (format === 'png') {
        // Check if canvas has content
        if (canvas.width === 0 || canvas.height === 0) {
          throw new Error('Generated canvas is empty');
        }
        
        console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
        
        // Convert to data URL and download
        const dataUrl = canvas.toDataURL('image/png');
        
        // Verify data URL is not empty
        if (!dataUrl || dataUrl === 'data:,') {
          throw new Error('Generated data URL is empty');
        }
        
        const link = document.createElement('a');
        link.download = `complaints-chart-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        
        // Force download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Chart exported successfully');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export chart: ' + error.message + '. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="w-full">
      {/* Header with title and controls */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-orbitron text-2xl text-yellow-400 mb-1">Complaints over time</h2>
          <p className="text-white/60 text-sm">Cumulative complaints (click a point to inspect incidents)</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Date range selector */}
          <div className="flex gap-2">
            {['7d', '30d', '3mo', '1yr', 'all'].map(range => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedRange === range
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 border border-transparent'
                }`}
              >
                {range === 'all' ? 'All' : range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Export buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => exportChartData(data, 'csv', 'complaints-chart')}
              className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-400/50 rounded-lg text-xs font-medium transition-colors"
              title="Export as CSV"
            >
              CSV
            </button>
            <button
              onClick={() => exportChartData(data, 'json', 'complaints-chart')}
              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-400/50 rounded-lg text-xs font-medium transition-colors"
              title="Export as JSON"
            >
              JSON
            </button>
            <button
              onClick={() => exportChartData(data, 'pdf', 'complaints-chart')}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/50 rounded-lg text-xs font-medium transition-colors"
              title="Export as PDF (falls back to HTML if PDF fails)"
            >
              PDF
            </button>
            <button
              onClick={() => handleExport('png')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Export chart as PNG image"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Latest value badge */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-4 py-2">
          <span className="text-white/70 text-sm">Total complaints:</span>
          <span className="font-orbitron text-2xl text-yellow-400">{maxCumulative}</span>
          {data.length > 1 && (
            <span className="text-xs px-2 py-1 bg-green-400/20 text-green-400 rounded-full">
              +{data[data.length - 1]?.daily || 0} today
            </span>
          )}
        </div>
      </div>

      {/* Chart container */}
      <div 
        ref={chartRef}
        className="bg-[#0B0D10]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl relative"
        style={{
          background: 'linear-gradient(135deg, rgba(11,13,16,0.6) 0%, rgba(5,6,7,0.8) 100%)',
        }}
      >
        {/* Grid pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onMouseMove={(e) => {
                if (e && e.activePayload) {
                  setHoveredData(e.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredData(null)}
            >
              {/* Subtle grid */}
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#ffffff" 
                strokeOpacity={0.03} 
                horizontal={true}
                vertical={false}
              />

              {/* X-axis */}
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#A0A6AD"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#A0A6AD', strokeWidth: 0.5 }}
                textTransform="uppercase"
                letterSpacing="0.04em"
              />

              {/* Y-axis */}
              <YAxis
                stroke="#A0A6AD"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#A0A6AD', strokeWidth: 0.5 }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                  return value.toString();
                }}
              />

              {/* Custom tooltip */}
              <Tooltip content={<CustomTooltip />} />

              {/* Area fill with gradient */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD93C" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#FFD93C" stopOpacity={0} />
                </linearGradient>
                
                {/* Glow filter */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation={6} result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Area chart (fill) */}
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="none"
                fill="url(#areaGradient)"
              />

              {/* Main line */}
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#FFD93C"
                strokeWidth={3}
                dot={false}
                filter="url(#glow)"
                animationDuration={2000}
                animationBegin={0}
              />

              {/* SLA violation markers */}
              {data.map((entry, index) => 
                entry.slaViolations > 0 ? (
                  <ReferenceLine
                    key={index}
                    x={entry.date}
                    stroke="#FF4C4C"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="text-white/50 text-lg mb-2">No complaints data available</div>
              <div className="text-white/30 text-sm">Try adjusting the date range or check back later</div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-6 right-6 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-white/70 text-xs">Cumulative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
            <span className="text-white/70 text-xs">Daily new</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsChart;
