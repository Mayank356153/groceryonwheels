const CashTransaction = require("../models/cashTransactionModel");

// CREATE Cash Transaction
exports.createCashTransaction = async (req, res) => {
  try {
    const { date, paymentCode, paymentType, paymentNote, createdBy, account } = req.body;

   
    if (!date || !paymentType) {
      return res.status(400).json({ success: false, message: "Date and Payment Type are required" });
    }

    const newTransaction = new CashTransaction({
      date,
      paymentCode,
      paymentType,
      paymentNote,
      createdBy,
      account,
    });

    const savedTransaction = await newTransaction.save();
    return res.status(201).json({
      success: true,
      message: "Cash Transaction created successfully",
      data: savedTransaction,
    });
  } catch (error) {
    console.error("Error creating cash transaction:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET All Cash Transactions
exports.getAllCashTransactions = async (req, res) => {
  try {
    const transactions = await CashTransaction.find()
      .populate("createdBy", "FirstName LastName Email")
      .populate("account", "accountName accountNumber")
      .populate("paymentType", "paymentTypeName");
    return res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error("Error fetching cash transactions:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/cash-transactions?user=<userId>&fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
exports.getFilteredCashTransactions = async (req, res) => {
    try {
      const { user, fromDate, toDate } = req.query;
  
      const query = {};
  
      if (user) {
        query.createdBy = user;
      }
      if (fromDate || toDate) {
        query.date = {};
        if (fromDate) {
          
          query.date.$gte = new Date(fromDate);
        }
        if (toDate) {
          
          query.date.$lte = new Date(toDate);
        }
      }
  
      const transactions = await CashTransaction.find(query)
        .populate("createdBy", "FirstName LastName Email")
        .populate("account", "accountName accountNumber")
        .populate("paymentType", "paymentTypeName");
  
      return res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      console.error("Error fetching filtered cash transactions:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
  


exports.getCashTransactionById = async (req, res) => {
  try {
    const transaction = await CashTransaction.findById(req.params.id)
      .populate("createdBy", "FirstName LastName Email")
      .populate("account", "accountName accountNumber")
      .populate("paymentType", "paymentTypeName");
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Cash Transaction not found" });
    }
    return res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    console.error("Error fetching cash transaction:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.updateCashTransaction = async (req, res) => {
  try {
    const updatedTransaction = await CashTransaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("createdBy", "FirstName LastName Email")
      .populate("account", "accountName accountNumber")
      .populate("paymentType", "paymentTypeName");

    if (!updatedTransaction) {
      return res.status(404).json({ success: false, message: "Cash Transaction not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Cash Transaction updated successfully",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("Error updating cash transaction:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.deleteCashTransaction = async (req, res) => {
  try {
    const deletedTransaction = await CashTransaction.findByIdAndDelete(req.params.id);
    if (!deletedTransaction) {
      return res.status(404).json({ success: false, message: "Cash Transaction not found" });
    }
    return res.status(200).json({ success: true, message: "Cash Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting cash transaction:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
