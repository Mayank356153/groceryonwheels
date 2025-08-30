import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

const ProfitLossReport = () => {
  const [startDate, setStartDate] = useState("2025-01-26");
  const [endDate, setEndDate] = useState("2025-02-24");
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sidebar state
  const [isSidebarOpen, setSidebarOpen] = useState(true);
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  // Fetch data from backend inside useEffect to avoid dependency issues
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `https://your-backend-api.com/profit-loss-report?startDate=${startDate}&endDate=${endDate}`
        );
        setReportData(response.data);
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [startDate, endDate]);

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar with sidebar state passed */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        {/* Sidebar */}
        <div >
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        {/* Main Content */}
        <div className="flex-grow px-4 mt-4 bg-white rounded shadow ">
          <h2 className="mb-3 text-dark">Profit & Loss Report</h2>
          <div className="mb-3 row">
            <div className="col-md-6">
              <label className="form-label">Select Date</label>
              <div className="input-group">
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="input-group-text">-</span>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mb-3 d-flex justify-content-end">
            <button className="btn btn-primary" onClick={() => {
              // Re-run the fetch logic when "Export" is clicked
              const fetchReportData = async () => {
                setLoading(true);
                setError(null);
                try {
                  const response = await axios.get(
                    `https://your-backend-api.com/profit-loss-report?startDate=${startDate}&endDate=${endDate}`
                  );
                  setReportData(response.data);
                } catch (err) {
                  setError("Failed to fetch data");
                } finally {
                  setLoading(false);
                }
              };
              fetchReportData();
            }}>
              Export
            </button>
          </div>
          {loading && <p>Loading data...</p>}
          {error && <p className="text-danger">{error}</p>}
          <table className="table table-bordered">
            <thead className="table-primary">
              <tr>
                <th>Category</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Gross Profit</strong></td>
                <td>{reportData.grossProfit || "0.00"}</td>
              </tr>
              <tr>
                <td><strong>Net Profit</strong></td>
                <td>{reportData.netProfit || "0.00"}</td>
              </tr>
              {/* Purchases Section */}
              <tr>
                <th colSpan="2" className="bg-light text-dark">Purchase</th>
              </tr>
              <tr>
                <td>Total Purchase</td>
                <td>{reportData.purchase?.totalPurchase || "0.00"}</td>
              </tr>
              <tr>
                <td>Total Purchase Tax</td>
                <td>{reportData.purchase?.totalPurchaseTax || "0.00"}</td>
              </tr>
              <tr>
                <td>Total Other Charges</td>
                <td>{reportData.purchase?.totalOtherCharges || "0.00"}</td>
              </tr>
              <tr>
                <td>Total Discount on Purchase</td>
                <td>{reportData.purchase?.totalDiscount || "0.00"}</td>
              </tr>
              <tr>
                <td>Paid Payment</td>
                <td>{reportData.purchase?.paidPayment || "0.00"}</td>
              </tr>
              <tr>
                <td>Purchase Due</td>
                <td>{reportData.purchase?.purchaseDue || "0.00"}</td>
              </tr>
              {/* Purchase Return Section */}
              <tr>
                <th colSpan="2" className="bg-light text-dark">Purchase Return</th>
              </tr>
              <tr>
                <td>Total Purchase Return</td>
                <td>{reportData.purchaseReturn?.totalPurchaseReturn || "0.00"}</td>
              </tr>
              <tr>
                <td>Total Purchase Return Tax</td>
                <td>{reportData.purchaseReturn?.totalPurchaseReturnTax || "0.00"}</td>
              </tr>
              <tr>
                <td>Total Discount on Purchase Return</td>
                <td>{reportData.purchaseReturn?.totalDiscountReturn || "0.00"}</td>
              </tr>
              {/* Sales Section */}
              <tr>
                <th colSpan="2" className="bg-light text-dark">Sales</th>
              </tr>
              <tr>
                <td>Sales (Before Tax)</td>
                <td>{reportData.sales?.salesBeforeTax || "0.00"}</td>
              </tr>
              <tr>
                <td>Total Sales Tax</td>
                <td>{reportData.sales?.totalSalesTax || "0.00"}</td>
              </tr>
              <tr>
                <td>Total Discount on Sales</td>
                <td>{reportData.sales?.totalDiscount || "0.00"}</td>
              </tr>
              <tr>
                <td>Coupon Discount</td>
                <td>{reportData.sales?.couponDiscount || "0.00"}</td>
              </tr>
              <tr>
                <td>Total Sales</td>
                <td>{reportData.sales?.totalSales || "0.00"}</td>
              </tr>
              <tr>
                <td>Paid Payment</td>
                <td>{reportData.sales?.paidPayment || "0.00"}</td>
              </tr>
              <tr>
                <td>Sales Due</td>
                <td>{reportData.sales?.salesDue || "0.00"}</td>
              </tr>
              {/* Sales Return Section */}
              <tr>
                <th colSpan="2" className="bg-light text-dark">Sales Return</th>
              </tr>
              <tr>
                <td>Total Sales Return</td>
                <td>{reportData.salesReturn?.totalSalesReturn || "0.00"}</td>
              </tr>
              <tr>
                <td>Total Sales Return Tax</td>
                <td>{reportData.salesReturn?.totalSalesReturnTax || "0.00"}</td>
              </tr>
              <tr>
                <td>Total Other Charges of Sales Return</td>
                <td>{reportData.salesReturn?.totalOtherChargesReturn || "0.00"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossReport;
