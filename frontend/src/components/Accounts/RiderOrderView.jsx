



import React, { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { X, Loader, CheckCircle, Clock, Truck, AlertCircle, ChevronDown, ChevronUp, Calendar } from 'react-feather';
import axios from 'axios';
import { jsPDF } from "jspdf";
import  {autoTable} from "jspdf-autotable";

const RiderOrderList = ({ orders, setRiderOrderView, riderInfo }) => {
  const [loading, setLoading] = useState(true);
  const [viewOrders, setViewOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('api/order/all', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      }); 
      console.log(response.data.data)
      const filteredOrder = response.data.data.filter(or => orders.includes(or._id));
      setViewOrders(filteredOrder);
      setFilteredOrders(filteredOrder); // Initialize filtered orders
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Apply date filter whenever dateRange or viewOrders changes
    if (viewOrders.length > 0) {
      const filtered = viewOrders.filter(order => {
        const orderDate = new Date(order.orderTime);
        return (
          orderDate >= startOfDay(dateRange.startDate) && 
          orderDate <= endOfDay(dateRange.endDate)
        );
      });
      setFilteredOrders(filtered);
    }
  }, [dateRange, viewOrders]);

  const toggleOrderDetails = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle className="text-green-500" size={18} />;
      case 'Processing':
        return <Clock className="text-blue-500" size={18} />;
      case 'Out for Delivery':
        return <Truck className="text-orange-500" size={18} />;
      default:
        return <AlertCircle className="text-gray-500" size={18} />;
    }
  };

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
      // Prepare rider information
      const riderdata = [
        ['Rider Information'],
        ['Name:', riderInfo?.username || 'N/A'],
        ['ID:', riderInfo?._id || 'N/A'],
        ['Phone:', riderInfo?.mobile || 'N/A'],
        ['Email:', riderInfo?.email || 'N/A'],
        ['Date Range:', `${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}`],
        [], // Empty row
        ['Order History'], // Section header
        [], // Empty row before headers
      ];

      // Prepare order data
      const orderHeaders = [
        'Order ID',
        'Status',
        'Date',
        'Items',
        'Amount',
        'Payment Method',
        'Payment Status'
      ];

      const orderData = filteredOrders.map(order => [
        order.orderId,
        order.status,
        format(new Date(order.orderTime), 'MMM dd, yyyy hh:mm a'),
        order.items.length,
        order.finalAmount,
        order.paymentMethod,
        order.paymentStatus
      ]);

      // Combine all data
      const allData = [...riderdata, orderHeaders, ...orderData];

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(allData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 20 }, // Order ID
        { wch: 15 }, // Status
        { wch: 20 }, // Date
        { wch: 8 },  // Items
        { wch: 12 }, // Amount
        { wch: 15 }, // Payment Method
        { wch: 15 }  // Payment Status
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      
      // Save file
      XLSX.writeFile(workbook, `Orders_${riderInfo?.username || 'Rider'}_${new Date().toISOString().slice(0,10)}.xlsx`);
    });
  };


  const handleExportToPDF = () => {
  const doc = new jsPDF();
   console.log(riderInfo)

  // --- 1. Rider Information Header ---
  if (riderInfo) {
    
    doc.setFontSize(16);
    doc.setTextColor(40, 53, 147);
    doc.text('Rider Information', 14, 20);
    
    const riderData = [
      ['Name:', riderInfo.username || 'N/A'],
      ['ID:', riderInfo._id || 'N/A'],
      ['Phone:', riderInfo.mobile || 'N/A'],
      ['Email:', riderInfo.email || 'N/A'],
      ['Date Range:', `${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}`]
    ];
    
    autoTable(doc, {
      startY: 25,
      head: [['', '']],
      body: riderData,
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      styles: { fontSize: 10, cellPadding: 1 }
    });
  }

  // --- 2. Orders Summary Table ---
  doc.setFontSize(16);
  doc.setTextColor(40, 53, 147);
  doc.text('Orders Summary', 14, doc.lastAutoTable?.finalY + 15 || 40);

  const orderHeaders = [
    'Order ID',
    'Status',
    'Date',
    'Items',
    'Amount',
    'Payment'
  ];

  const orderData = filteredOrders.map(order => [
    order.orderId,
    order.status,
    format(new Date(order.orderTime), 'MMM dd, yyyy'),
    order.items.length,
    `₹${Number(order.finalAmount)?.toLocaleString()}`,
    order.paymentMethod
  ]);

  autoTable(doc, {
  startY: doc.lastAutoTable?.finalY + 20 || 45,
  head: [orderHeaders],
  body: orderData,
  theme: 'grid',
  headStyles: { fillColor: [40, 53, 147], textColor: [255, 255, 255] },
  styles: { fontSize: 9, cellPadding: 3 },
  columnStyles: {
    0: { cellWidth: 40 }, // Order ID
    1: { cellWidth: 25 }, // Status
    2: { cellWidth: 30 }, // Date
    3: { cellWidth: 20 }, // Items
    4: { cellWidth: 30 }, // Amount
    5: { cellWidth: 30 }  // Payment
  }
});

if (filteredOrders.length > 0) {
  doc.addPage(); // 👈 Start fresh for detailed orders
}
  // --- 3. Detailed Orders (One per page) ---
  filteredOrders.forEach((order, index) => {
    if (index > 0) doc.addPage(); // New page for each order after first
    
    // Order Header
    doc.setFontSize(14);
    doc.setTextColor(40, 53, 147);
    doc.text(`Order #${order.orderId}`, 14, 20);
    
    // Basic Info
    autoTable(doc, {
      startY: 25,
      body: [
        ['Status:', order.status],
        ['Order Date:', format(new Date(order.orderTime), 'MMM dd, yyyy hh:mm a')],
        ['Items Count:', order.items.length],
        ['Final Amount:', `₹${order.finalAmount?.toLocaleString()}`]
      ],
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    // Shipping Address
    doc.setFontSize(12);
    doc.text('Shipping Information', 14, doc.lastAutoTable.finalY + 10);
    
    if (order.shippingAddress?.length > 0) {
      const address = order.shippingAddress[0];
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        body: [
          ['Area:', address.area],
          ['Address:', `${address.houseNo}, ${address.city}`],
          ['State:', address.state],
          ['Postal Code:', address.postalCode],
          ['Country:', address.country],
          ...(address.locationLink ? [['Location:', { content: address.locationLink, link: address.locationLink }]] : [])
        ],
        columnStyles: {
          1: { cellWidth: 'auto' }
        },
        styles: { fontSize: 10 }
      });
    }

    // Payment Info
    doc.setFontSize(12);
    doc.text('Payment Information', 14, doc.lastAutoTable.finalY + 10);
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      body: [
        ['Method:', order.paymentMethod],
        ['Status:', order.paymentStatus],
        ['Order Total:', `₹${order.totalAmount}`],
        ...(order.discountApplied > 0 ? [['Discount:', `-₹${order.discountApplied}`]] : []),
        ['Final Amount:', `₹${order.finalAmount}`]
      ],
      styles: { fontSize: 10 }
    });

    // Items Table
    doc.setFontSize(12);
    doc.text('Order Items', 14, doc.lastAutoTable.finalY + 10);
    
    const itemHeaders = ['Item', 'Qty', 'Price', 'Subtotal'];
    const itemData = order.items.map(item => [
      item.item?.itemName || 'Unnamed Item',
      item.quantity,
      item.price?.toLocaleString(),
      (item.price * item.quantity)-item.discount
    ]);
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [itemHeaders],
      body: itemData,
      theme: 'grid',
      headStyles: { fillColor: [40, 53, 147], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 'auto' }, // Item name
        1: { cellWidth: 15 },     // Qty
        2: { cellWidth: 20 },     // Price
        3: { cellWidth: 20 }      // Subtotal
      },
      styles: { fontSize: 9 }
    });
  });

  // Save PDF
  const filename = `Orders_${riderInfo?.username || 'Rider'}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
};



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh]  bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
            <p className="text-sm text-gray-500">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
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
              onClick={() => setRiderOrderView(false)}
              className="p-1 text-gray-500 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Date Picker */}
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
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading orders</h3>
              <p className="mt-2 text-gray-500">{error}</p>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="p-4 mb-4 bg-gray-100 rounded-full">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-gray-500">
                {viewOrders.length === 0 ? 'Orders will appear here once assigned' : 'No orders match the selected date range'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <div key={order._id} className="transition-colors hover:bg-gray-50/50">
                  {/* ... (rest of your order rendering code remains the same) ... */}
                   <div className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-gray-50">
                          {getStatusIcon(order.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">Order #{order.orderId}</p>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'Out for Delivery' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {format(new Date(order.orderTime), 'MMM dd, yyyy • hh:mm a')}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="sm:text-right">
                        <p className="font-medium text-gray-900">
                          ₹{order.finalAmount?.toLocaleString()}
                        </p>
                        <div className="flex gap-2 mt-2 sm:justify-end">
                          <button 
                            onClick={() => toggleOrderDetails(order._id)}
                            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            Details
                            {expandedOrder === order._id ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                          {order.status === 'Out for Delivery' && (
                            <button className="px-3 py-1 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
                              Track
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Details Section */}
                  {expandedOrder === order._id && (
                    <div className="h-full p-6 pt-0 overflow-y-auto border-t py-14">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Shipping Information */}
                        <div>
                          <h3 className="mb-3 font-medium text-gray-900">Shipping Information</h3>
                          {order.shippingAddress?.length > 0 && (
                            <div className="p-4 rounded-lg bg-gray-50">
                              <p className="font-medium">{order.shippingAddress[0].area}</p>
                              <p>{order.shippingAddress[0].houseNo}, {order.shippingAddress[0].city}</p>
                              <p>{order.shippingAddress[0].state}, {order.shippingAddress[0].postalCode}</p>
                              <p>{order.shippingAddress[0].country}</p>
                              {order.shippingAddress[0].locationLink && (
                                <a 
                                  href={order.shippingAddress[0].locationLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                                >
                                  View Location
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Payment Information */}
                        <div>
                          <h3 className="mb-3 font-medium text-gray-900">Payment Information</h3>
                          <div className="p-4 rounded-lg bg-gray-50">
                            <div className="flex justify-between py-1">
                              <span className="text-gray-600">Method:</span>
                              <span className="font-medium">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-gray-600">Status:</span>
                              <span className={`font-medium ${
                                order.paymentStatus === 'Completed' ? 'text-green-600' :
                                order.paymentStatus === 'Failed' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-gray-600">Order Total:</span>
                              <span className="font-medium">₹{order.totalAmount?.toLocaleString()}</span>
                            </div>
                            {order.discountApplied > 0 && (
                              <div className="flex justify-between py-1">
                                <span className="text-gray-600">Discount:</span>
                                <span className="font-medium text-green-600">-₹{order.discountApplied?.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between py-1 pt-2 mt-2 border-t border-gray-200">
                              <span className="text-gray-600">Final Amount:</span>
                              <span className="font-medium">₹{order.finalAmount?.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="md:col-span-2">
                          <h3 className="mb-3 font-medium text-gray-900">Items</h3>
                          <div className="overflow-hidden border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Item</th>
                                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Qty</th>
                                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Price</th>
                                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {order.items?.map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                      {item.item?.name || `Item ${index + 1}`}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-500 whitespace-nowrap">
                                      {item.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-500 whitespace-nowrap">
                                      ₹{item.price?.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-500 whitespace-nowrap">
                                      ₹{(item.price * item.quantity)?.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 bg-white border-t">
          <div className="flex justify-between">
            {filteredOrders.length > 0 && (
              <div className="flex gap-2">
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
              </div>
            )}
            <button
              onClick={() => setRiderOrderView(false)}
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

export default RiderOrderList;