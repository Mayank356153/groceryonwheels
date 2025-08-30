const Purchase = require("../models/purchaseModel");
const Sale = require("../models/Sales");
const Expense = require("../models/expenseModel");
const Customer = require("../models/customerDataModel");
const Supplier = require("../models/supplierModel");
const items = require("../models/itemModel");
const pos=require("../models/PosOrder")
const mongoose = require("mongoose");
exports.getDashboardSummary = async (req, res) => {
    try {
      const [
        purchaseDue,
        salesDue,
        totalSales,
        totalExpense,
        customerCount,
        supplierCount,
        purchaseCount,
        invoiceCount,
      ] = await Promise.all([
        Purchase.aggregate([
          { $match: { status: 'Due' } },
          { $group: { _id: null, total: { $sum: "$grandTotal" } } },
        ]),
        Sale.aggregate([
          { $match: { status: 'Due' } },
          { $group: { _id: null, total: { $sum: "$grandTotal" } } },
        ]),
        Sale.aggregate([
          { $group: { _id: null, total: { $sum: "$grandTotal" } } },
        ]),
        Expense.aggregate([
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Customer.countDocuments(),
        Supplier.countDocuments(),
        Purchase.countDocuments(),
        Sale.countDocuments(),
      ]);
  
      res.status(200).json({
        success: true,
        data: {
          purchaseDue: purchaseDue[0]?.total || 0,
          salesDue: salesDue[0]?.total || 0,
          totalSales: totalSales[0]?.total || 0,
          totalExpense: totalExpense[0]?.total || 0,
          customerCount,
          supplierCount,
          purchaseCount,
          invoiceCount,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  exports.getChartData = async (req, res) => {
    const { interval = 'monthly' } = req.query;
    const groupFormat = {
      daily: "%Y-%m-%d",
      weekly: "%Y-%U",
      monthly: "%Y-%m",
      yearly: "%Y"
    }[interval];
  
    try {
      const [purchases, sales, expenses] = await Promise.all([
        Purchase.aggregate([
          { 
            $group: { 
              _id: { $dateToString: { format: groupFormat, date: "$createdAt" } }, 
              total: { $sum: "$grandTotal" } 
            } 
          }
        ]),
        Sale.aggregate([
          { 
            $group: { 
              _id: { $dateToString: { format: groupFormat, date: "$createdAt" } }, 
              total: { $sum: "$grandTotal" } 
            } 
          }
        ]),
        Expense.aggregate([
          { 
            $group: { 
              _id: { $dateToString: { format: groupFormat, date: "$createdAt" } }, 
              total: { $sum: "$amount" } 
            } 
          }
        ])
      ]);
  
      res.status(200).json({
        success: true,
        data: { purchases, sales, expenses }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};


