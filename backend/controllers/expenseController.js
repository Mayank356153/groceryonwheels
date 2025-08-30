const mongoose = require("mongoose");
const Expense = require("../models/expenseModel");
const PaymentType = require("../models/paymentTypeModel");
const Warehouse = require("../models/warehouseModel");
const Ledger = require("../models/ledgerModel");
const { recordExpense } = require("../services/recordExpense");

// CREATE Expense
exports.createExpense = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        date,
        referenceNo,
        category,
        expenseFor,
        paymentType,
        account,
        amount,
        inOut,
        note,
        status,
      } = req.body;

      // Validate required fields
      if (!date || !paymentType || !account || !amount || !inOut) {
        throw new Error("Missing required fields");
      }
      if (!["In", "Out"].includes(inOut)) {
        throw new Error("Invalid inOut value; must be 'In' or 'Out'");
      }
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Validate paymentType (must be Cash or Bank)
      const validPaymentType = await PaymentType.findById(paymentType).session(session);
      if (!validPaymentType || !["cash", "bank"].includes(validPaymentType.paymentTypeName.toLowerCase())) {
        throw new Error("Invalid Payment Type; must be Cash or Bank");
      }

      // Validate account
      const validAccount = await mongoose.model("Account").findById(account).session(session);
      if (!validAccount) {
        throw new Error("Invalid Account ID");
      }

      // Validate warehouse
      const warehouse = await Warehouse.findOne({ cashAccount: account })
        .select("_id")
        .lean()
        .session(session);
      if (!warehouse?._id) {
        throw new Error("Warehouse not found for this account");
      }

      // Set createdBy and createdByModel
      if (req.user && req.user.id) {
        req.body.createdBy = req.user.id;
        req.body.createdByModel =
          req.user.role.toLowerCase() === "admin" ? "Admin" : "User";
      } else {
        throw new Error("User authentication required");
      }

      // Create expense document
      const [newExpense] = await Expense.create(
        [{
          date,
          referenceNo,
          category,
          expenseFor,
          paymentType,
          account,
          amount,
          inOut,
          note,
          status: status || "Active",
          createdBy: req.body.createdBy,
          createdByModel: req.body.createdByModel,
        }],
        { session }
      );

      // Update account balance using recordExpense
      await recordExpense({ session, account, amount, inOut });

      // Create Ledger entry for cash summary
      const balanceChange = inOut === "In" ? amount : -amount;
      await Ledger.create(
        [{
          date: new Date(date),
          type: "EXPENSE",
          amount: balanceChange,
          warehouse: warehouse._id,
          referenceId: newExpense._id,
          refModel: "Expense",
          remark: note || (inOut === "In" ? "Income recorded" : "Expense recorded"),
        }],
        { session, ordered: true }
      );

      return res.status(201).json({
        success: true,
        message: "Transaction created successfully",
        data: newExpense,
      });
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// UPDATE Expense
exports.updateExpense = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id } = req.params;
      const {
        date,
        referenceNo,
        category,
        expenseFor,
        paymentType,
        account,
        amount,
        inOut,
        note,
        status,
      } = req.body;

      // Validate required fields
      if (!date || !paymentType || !account || !amount || !inOut) {
        throw new Error("Missing required fields");
      }
      if (!["In", "Out"].includes(inOut)) {
        throw new Error("Invalid inOut value; must be 'In' or 'Out'");
      }
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Validate paymentType
      const validPaymentType = await PaymentType.findById(paymentType).session(session);
      if (!validPaymentType || !["cash", "bank"].includes(validPaymentType.paymentTypeName.toLowerCase())) {
        throw new Error("Invalid Payment Type; must be Cash or Bank");
      }

      // Load existing expense
      const oldExpense = await Expense.findById(id).session(session);
      if (!oldExpense) {
        throw new Error("Transaction not found");
      }

      // Reverse old account balance
      await recordExpense({
        session,
        account: oldExpense.account,
        amount: oldExpense.amount,
        inOut: oldExpense.inOut === "In" ? "Out" : "In", // Reverse the effect
      });

      // Delete old Ledger entry
      const oldWarehouse = await Warehouse.findOne({ cashAccount: oldExpense.account })
        .select("_id")
        .lean()
        .session(session);
      if (oldWarehouse?._id) {
        const oldBalanceChange = oldExpense.inOut === "In" ? oldExpense.amount : -oldExpense.amount;
        await Ledger.deleteOne(
          {
            type: "EXPENSE",
            date: new Date(oldExpense.date),
            amount: oldBalanceChange,
            warehouse: oldWarehouse._id,
            referenceId: oldExpense._id,
          },
          { session }
        );
      }

      // Validate new account
      const validAccount = await mongoose.model("Account").findById(account).session(session);
      if (!validAccount) {
        throw new Error("Invalid Account ID");
      }

      // Validate new warehouse
      const newWarehouse = await Warehouse.findOne({ cashAccount: account })
        .select("_id")
        .lean()
        .session(session);
      if (!newWarehouse?._id) {
        throw new Error("Warehouse not found for this account");
      }

      // Update expense document
      const updatedExpense = await Expense.findByIdAndUpdate(
        id,
        {
          date,
          referenceNo,
          category,
          expenseFor,
          paymentType,
          account,
          amount,
          inOut,
          note,
          status: status || "Active",
        },
        { new: true, session }
      )
        .populate("category", "categoryName")
        .populate("paymentType", "paymentTypeName status")
        .populate("account", "accountName");

      // Update account balance
      await recordExpense({ session, account, amount, inOut });

      // Create new Ledger entry
      const newBalanceChange = inOut === "In" ? amount : -amount;
      await Ledger.create(
        [{
          date: new Date(date),
          type: "EXPENSE",
          amount: newBalanceChange,
          warehouse: newWarehouse._id,
          referenceId: updatedExpense._id,
          refModel: "Expense",
          remark: note || (inOut === "In" ? "Income recorded" : "Expense recorded"),
        }],
        { session, ordered: true }
      );

      return res.status(200).json({
        success: true,
        message: "Transaction updated successfully",
        data: updatedExpense,
      });
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// DELETE Expense
exports.deleteExpense = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const expense = await Expense.findById(req.params.id).session(session);
      if (!expense) {
        throw new Error("Transaction not found");
      }

      // Reverse account balance
      await recordExpense({
        session,
        account: expense.account,
        amount: expense.amount,
        inOut: expense.inOut === "In" ? "Out" : "In", // Reverse the effect
      });

      // Delete Ledger entry
      const warehouse = await Warehouse.findOne({ cashAccount: expense.account })
        .select("_id")
        .lean()
        .session(session);
      if (warehouse?._id) {
        const balanceChange = expense.inOut === "In" ? expense.amount : -expense.amount;
        await Ledger.deleteOne(
          {
            type: "EXPENSE",
            date: new Date(expense.date),
            amount: balanceChange,
            warehouse: warehouse._id,
            referenceId: expense._id,
          },
          { session }
        );
      }

      // Delete the expense
      await Expense.findByIdAndDelete(req.params.id, { session });

      return res.status(200).json({
        success: true,
        message: "Transaction deleted successfully",
      });
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// GET All Expenses (unchanged)
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("category", "categoryName")
      .populate("paymentType", "paymentTypeName status")
      .populate("account", "accountName")
      .populate("createdBy", "name FirstName LastName email");

    const processedExpenses = expenses.map((expense) => {
      let creatorName = "";
      if (expense.createdBy) {
        creatorName = expense.createdBy.name
          ? expense.createdBy.name
          : `${expense.createdBy.FirstName} ${expense.createdBy.LastName}`;
      }
      return {
        ...expense.toObject(),
        creatorName,
      };
    });

    return res.status(200).json({
      success: true,
      data: processedExpenses,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET Single Expense (unchanged)
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("category", "categoryName")
      .populate("paymentType", "paymentTypeName status")
      .populate("account", "accountName")
      .populate("createdBy", "name FirstName LastName email");

    if (!expense) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    let creatorName = "";
    if (expense.createdBy) {
      creatorName = expense.createdBy.name
        ? expense.createdBy.name
        : `${expense.createdBy.FirstName} ${expense.createdBy.LastName}`;
    }
    const processedExpense = { ...expense.toObject(), creatorName };

    return res.status(200).json({ success: true, data: processedExpense });
  } catch (error) {
    console.error("Error fetching expense:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};