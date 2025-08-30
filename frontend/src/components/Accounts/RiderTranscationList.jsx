import React,{useState,useEffect} from 'react';
import { format ,subDays, startOfDay, endOfDay} from 'date-fns';
import { X ,ChevronDown, ChevronUp, Calendar} from 'react-feather';
import { jsPDF } from "jspdf";
import  {autoTable} from "jspdf-autotable";

const RiderTransactionsList = ({ transactions, setRiderTransactionsView,riderInfo }) => {
   const [dateRange, setDateRange] = useState({
      startDate: subDays(new Date(), 7),
      endDate: new Date()
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState(transactions);

      
        useEffect(() => {
          // Apply date filter whenever dateRange or viewOrders changes
          if (transactions.length > 0) {
            const filtered = transactions.filter(order => {
              const orderDate = new Date(order.createdAt);
              return (
                orderDate >= startOfDay(dateRange.startDate) && 
                orderDate <= endOfDay(dateRange.endDate)
              );
            });
            setFilteredOrders(filtered);
          }
        }, [dateRange]);

   
     const handleDateChange = (e, type) => {
       setDateRange(prev => ({
         ...prev,
         [type]: new Date(e.target.value)
       }));
     };
   
     const resetDateFilter = () => {
       setDateRange({
         startDate: subDays(new Date(), 7),
         endDate: new Date()
       });
     };
        
    
const handleExportToExcel = () => {
  import('xlsx').then((XLSX) => {
    // 1. Prepare rider information
    const riderData = [
      ['Rider Information', '', '', '', '', ''], // Extra cells for full width
      ['Name:', riderInfo?.username || 'N/A'],
      ['ID:', riderInfo?._id || 'N/A'],
      ['Phone:', riderInfo?.mobile || 'N/A'],
      ['Email:', riderInfo?.email || 'N/A'],
      ['Account Number:', riderInfo?.riderAccount?.accountNumber || 'N/A'],
      [], // Empty row
      ['Transaction History', '', '', '', '', ''], // Section header
      [], // Empty row before headers
    ];

    // 2. Prepare transaction data
    const headers = [
      'Transaction ID',
      'Type',
      'Amount',
      'Transaction Type',
      'Date',
      'Status'
    ];

    const transactionData = filteredOrders.map(txn => [
      txn.transactionId || txn._id || 'N/A', // Fallback for ID
      txn.type || 'N/A',
      txn.amount || 0,
      txn.format || 'N/A',
      txn.createdAt ? format(new Date(txn.createdAt), 'MMM dd, yyyy hh:mm a') : 'N/A',
      'Completed'
    ]);

    // 3. Combine all data
    const allData = [...riderData, headers, ...transactionData];

    // 4. Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(allData);

    // 5. Helper function to safely apply styles
    const applyStyle = (cell, style) => {
      if (!worksheet[cell]) {
        worksheet[cell] = { t: 's', v: worksheet[cell]?.v || '' };
      }
      worksheet[cell].s = style;
    };

    // 6. Apply styles
    // Rider info header (blue background with white text)
    applyStyle('A1', {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } }
    });

    // Transaction history header (green background with white text)
    applyStyle('A7', {
      font: { bold: true, size: 14, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "70AD47" } }
    });

    // Column headers (light gray background)
    headers.forEach((_, i) => {
      const cell = XLSX.utils.encode_cell({ r: riderData.length, c: i });
      applyStyle(cell, {
        font: { bold: true },
        fill: { fgColor: { rgb: "F2F2F2" } }
      });
    });

    // 7. Set column widths
    worksheet['!cols'] = [
      { wch: 24 }, // Transaction ID
      { wch: 18 }, // Type
      { wch: 12 }, // Amount
      { wch: 18 }, // Transaction Type
      { wch: 22 }, // Date
      { wch: 12 }  // Status
    ];

    // 8. Create and save workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rider Transactions');
    
    const fileName = `Transactions_${riderInfo?.username?.replace(/\s+/g, '_') || 'Rider'}_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }).catch(error => {
    console.error('Error exporting to Excel:', error);
    // Optionally show user feedback here
    alert('Failed to export transactions. Please try again.');
  });
};




const handleExportToPDF = () => {
  // Create new PDF instance
  const doc = new jsPDF();
   console.log(riderInfo)
  // Add rider information section only if riderInfo exists
  if (riderInfo) {
    doc.setFontSize(16);
    doc.setTextColor(40, 53, 147);
    doc.text('Rider Information', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    console.log("username:", riderInfo.username);
console.log("id:", riderInfo._id);
console.log("mobile:", riderInfo.mobile);
console.log("email:", riderInfo.email);

    const riderData = [
      ['Name:', riderInfo.username || 'N/A'],
      ['ID:', riderInfo._id || 'N/A'],
      ['Phone:', riderInfo.mobile || 'N/A'],
      ['Email:', riderInfo.email || 'N/A'],
      ['Date Range:', `${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}`]
    ];
    console.log(riderData)
    autoTable(doc, {
      startY: 25,
      head: [['', '']],
      body: riderData,
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      styles: { fontSize: 10, cellPadding: 1 }
    });
  } else {
    // If no riderInfo, start lower or show a message
    doc.text('No rider information available', 14, 20);
  }

  // Calculate starting Y position for transactions
  const transactionsStartY = riderInfo ? doc.lastAutoTable.finalY + 15 : 25;
  
  // Add transactions section header
  doc.setFontSize(16);
  doc.setTextColor(40, 53, 147);
  doc.text('Transaction History', 14, transactionsStartY);

  // Prepare transaction data with fallbacks
  const transactionHeaders = [
    'Transaction ID',
    'Type',
    'Amount',
    'Transaction Type',
    'Date'
  ];

  const transactionData = filteredOrders.length > 0 
    ? filteredOrders.map(txn => [
        txn.transactionId || txn._id || 'N/A',
        txn.type || 'N/A',
        `${txn.format === 'Debited' ? '-' : '+'}${txn.amount || 0}`,
        txn.format || 'N/A',
        txn.createdAt ? format(new Date(txn.createdAt), 'MMM dd, yyyy hh:mm a') : 'N/A'
      ])
    : [['No transactions available', '', '', '', '']]; // Fallback for empty transactions

  // Add transactions table
  autoTable(doc, {
    startY: transactionsStartY + 10,
    head: [transactionHeaders],
    body: transactionData,
    theme: 'grid',
    headStyles: { fillColor: [40, 53, 147], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  // Generate filename with fallbacks
  const riderName = riderInfo?.username ? riderInfo.username.replace(/\s+/g, '_') : 'Rider';
  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`Transactions_${riderName}_${dateStamp}.pdf`);
};
  return (
    
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
  <div className="relative w-full max-w-4xl max-h-[90vh]  bg-white rounded-xl shadow-2xl">
    {/* Header */}
<div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rider Transactions History</h2>
            <p className="text-sm text-gray-500">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'transaction' : 'transactions'} found
              {dateRange.startDate && dateRange.endDate && (
                <span className="ml-2">
                  ({format(dateRange.startDate, 'MMM dd')} - {format(dateRange.endDate, 'MMM dd')})
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Calendar size={16} />
              Filter Dates
            </button>
            <button 
              onClick={() => setRiderTransactionsView(false)}
              className="p-1 text-gray-500 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>
         {showDatePicker && (
                  <div className="sticky z-10 p-4 border-b top-20 bg-gray-50">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                          type="date"
                          value={format(dateRange.startDate, 'yyyy-MM-dd')}
                          onChange={(e) => handleDateChange(e, 'startDate')}
                          className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                          type="date"
                          value={format(dateRange.endDate, 'yyyy-MM-dd')}
                          onChange={(e) => handleDateChange(e, 'endDate')}
                          className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={resetDateFilter}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

    {/* Content */}
    <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="p-4 mb-4 bg-gray-100 rounded-full">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No transactions yet</h3>
          <p className="mt-1 text-gray-500">Transactions will appear here once made</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredOrders.map((txn) => (
            <div key={txn._id} className="p-4 transition-colors hover:bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    txn.format === 'Debited' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {txn.format === 'Debited' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{txn.type}</p>
                    <p className="text-sm text-gray-500">{format(new Date(txn.createdAt), 'MMM dd, yyyy • hh:mm a')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    txn.format === 'Debited' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {txn.format === 'Debited' ? '-' : '+'}{txn.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{txn.transactionId}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Footer */}
    {/* <div className="sticky bottom-0 p-4 bg-white border-t">
      <div className="flex justify-between">
        {transactions.length > 0 && (
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>
        )}
        <button
          onClick={() => setRiderTransactionsView(false)}
          className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div> */}
    
<div className="sticky bottom-0 p-4 bg-white border-t">
  <div className="flex justify-between">
    <div className="flex gap-2">
      {transactions.length > 0 && (
        <>
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <button
            onClick={handleExportToPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
        </>
      )}
    </div>
    <button
      onClick={() => setRiderTransactionsView(false)}
      className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
    >
      Close
    </button>
  </div>
</div>
  </div>
</div>
  );
};

export default RiderTransactionsList;