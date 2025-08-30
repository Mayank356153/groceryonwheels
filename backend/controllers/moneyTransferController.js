// controllers/moneyTransferController.js
require("dotenv").config();
const mongoose        = require("mongoose");
const MoneyTransfer   = require("../models/moneyTransferModel");
const Warehouse       = require("../models/warehouseModel");
const Ledger          = require("../models/ledgerModel");
const { recordTransfer } = require("../services/recordTransfer");
const { getNextSequence, formatCode } = require("../utils/sequence");

/**
 * Create a new money transfer, update both accounts, and record in Ledger.
 */
exports.createMoneyTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  let newTransfer;

  try {
    await session.withTransaction(async () => {
      const {
        transferDate,
        debitAccount,
        creditAccount,
        amount,
        referenceNo,
        note
      } = req.body;

      // 1️⃣ Basic validation
      if (!transferDate || !debitAccount || !creditAccount || !amount) {
        throw new Error("Missing required fields");
      }
      if (debitAccount === creditAccount) {
        throw new Error("debitAccount and creditAccount cannot be the same");
      }

      // 2️⃣ Verify accounts exist
      const [debitAcc, creditAcc] = await Promise.all([
        mongoose.model("Account").findById(debitAccount).session(session),
        mongoose.model("Account").findById(creditAccount).session(session)
      ]);
      if (!debitAcc || !creditAcc) {
        throw new Error("Invalid debit or credit account");
      }

      // 3️⃣ Generate unique transferCode
      const seq = await getNextSequence("transferCode");
      const transferCode = formatCode("TR", seq);

      // 4️⃣ Create transfer document
      [newTransfer] = await MoneyTransfer.create(
        [{
          transferDate,
          transferCode,
          debitAccount,
          creditAccount,
          amount,
          referenceNo,
          note,
          createdBy: req.user?.id || null,
          createdByModel: req.user?.role?.toLowerCase() === "admin" ? "Admin" : "User"
        }],
        { session }
      );

      // 5️⃣ Adjust both account balances
      await recordTransfer({ session, debitAccount, creditAccount, amount });

      // 6️⃣ Record in Ledger for cash-summary
      const [debitWh, creditWh] = await Promise.all([
        Warehouse.findOne({ cashAccount: debitAccount }).select("_id").lean(),
        Warehouse.findOne({ cashAccount: creditAccount }).select("_id").lean()
      ]);

      if (!debitWh?._id) {
        throw new Error("Warehouse not found for debit account");
      }
      if (!creditWh?._id) {
        throw new Error("Warehouse not found for credit account");
      }

      // Create two Ledger entries with ordered: true
      await Ledger.create([
        {
          date: new Date(transferDate),
          type: "MONEY_TRANSFER",
          amount: amount, // Debit (negative)
          warehouse: debitWh._id,
          remark: note || "Transfer to main warehouse"
        },
        {
          date: new Date(transferDate),
          type: "MONEY_TRANSFER",
          amount: -amount, // Credit (positive)
          warehouse: creditWh._id,
          remark: note || "Received from warehouse"
        }
      ], { session, ordered: true }); // Add ordered: true

    });

    return res.status(201).json({
      success: true,
      message: "Money Transfer created",
      data: newTransfer
    });

  } catch (err) {
    console.error("Error creating money transfer:", err);
    return res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * List all money transfers, with account & creator populated and creatorName.
 */
exports.getAllTransfers = async (req, res) => {
  try {
    const transfers = await MoneyTransfer.find()
      .populate("debitAccount",  "accountName accountNumber")
      .populate("creditAccount", "accountName accountNumber")
      .populate("createdBy",     "FirstName LastName name");

    const processed = transfers.map(t => {
      let creatorName = "";
      if (t.createdBy) {
        creatorName = t.createdBy.name
          ? t.createdBy.name
          : `${t.createdBy.FirstName} ${t.createdBy.LastName}`;
      }
      return { ...t.toObject(), creatorName };
    });

    return res.status(200).json({ success: true, data: processed });
  } catch (err) {
    console.error("Error fetching transfers:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get a single transfer by ID (with populated fields and creatorName).
 */
exports.getTransferById = async (req, res) => {
  try {
    const t = await MoneyTransfer.findById(req.params.id)
      .populate("debitAccount",  "accountName accountNumber")
      .populate("creditAccount", "accountName accountNumber")
      .populate("createdBy",     "FirstName LastName name");
    if (!t) {
      return res.status(404).json({ success: false, message: "Transfer not found" });
    }
    let creatorName = "";
    if (t.createdBy) {
      creatorName = t.createdBy.name
        ? t.createdBy.name
        : `${t.createdBy.FirstName} ${t.createdBy.LastName}`;
    }
    return res.status(200).json({ success: true, data: { ...t.toObject(), creatorName } });
  } catch (err) {
    console.error("Error fetching transfer:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update an existing money transfer; reverse old ledger entry, apply new, and record.
 */
exports.updateTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id } = req.params;
      const {
        transferDate,
        debitAccount,
        creditAccount,
        amount,
        referenceNo,
        note
      } = req.body;

      // Validation
      if (!transferDate || !debitAccount || !creditAccount || !amount) {
        throw new Error("Missing required fields");
      }
      if (debitAccount === creditAccount) {
        throw new Error("debitAccount and creditAccount cannot be the same");
      }

      // 1) Load the existing transfer
      const old = await MoneyTransfer.findById(id).session(session);
      if (!old) throw new Error("Transfer not found");

      // 2) Reverse the old account movement
      await recordTransfer({
        debitAccount: old.creditAccount.toString(),
        creditAccount: old.debitAccount.toString(),
        amount: old.amount,
        session
      });

      // 3) Remove the old ledger entries
      const [oldDebitWh, oldCreditWh] = await Promise.all([
        Warehouse.findOne({ cashAccount: old.debitAccount }).select("_id").lean(),
        Warehouse.findOne({ cashAccount: old.creditAccount }).select("_id").lean()
      ]);

      if (oldDebitWh?._id) {
        await Ledger.deleteOne({
          type: "MONEY_TRANSFER",
          date: new Date(old.transferDate),
          amount: old.amount, // Old debit entry (positive in original code)
          warehouse: oldDebitWh._id
        }).session(session);
      }
      if (oldCreditWh?._id) {
        await Ledger.deleteOne({
          type: "MONEY_TRANSFER",
          date: new Date(old.transferDate),
          amount: -old.amount, // Old credit entry (if exists)
          warehouse: oldCreditWh._id
        }).session(session);
      }

      // 4) Update the transfer document
      old.transferDate = transferDate;
      old.debitAccount = debitAccount;
      old.creditAccount = creditAccount;
      old.amount = amount;
      old.referenceNo = referenceNo;
      old.note = note;
      await old.save({ session });

      // 5) Apply the new account movement
      await recordTransfer({ debitAccount, creditAccount, amount, session });

      // 6) Record the new ledger entries
      const [newDebitWh, newCreditWh] = await Promise.all([
        Warehouse.findOne({ cashAccount: debitAccount }).select("_id").lean(),
        Warehouse.findOne({ cashAccount: creditAccount }).select("_id").lean()
      ]);

      if (!newDebitWh?._id) throw new Error("Warehouse not found for debit account");
      if (!newCreditWh?._id) throw new Error("Warehouse not found for credit account");

      await Ledger.create([
        {
          date: new Date(transferDate),
          type: "MONEY_TRANSFER",
          amount: amount, // Debit (negative)
          warehouse: newDebitWh._id,
          remark: note || "Transfer to main warehouse"
        },
        {
          date: new Date(transferDate),
          type: "MONEY_TRANSFER",
          amount: -amount, // Credit (positive)
          warehouse: newCreditWh._id,
          remark: note || "Received from warehouse"
        }
      ], { session, ordered: true }); // Add ordered: true

      // Reload and return
      const updated = await MoneyTransfer.findById(req.params.id)
        .populate("debitAccount", "accountName accountNumber")
        .populate("creditAccount", "accountName accountNumber")
        .populate("createdBy", "FirstName LastName name");
      let creatorName = "";
      if (updated.createdBy) {
        creatorName = updated.createdBy.name
          ? updated.createdBy.name
          : `${updated.createdBy.FirstName} ${updated.createdBy.LastName}`;
      }
      return res.status(200).json({
        success: true,
        message: "Transfer updated successfully",
        data: { ...updated.toObject(), creatorName }
      });
    });
  } catch (err) {
    console.error("Error updating money transfer:", err);
    return res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

exports.deleteTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const toDelete = await MoneyTransfer.findById(req.params.id).session(session);
      if (!toDelete) {
        return res.status(404).json({ success: false, message: "Transfer not found" });
      }

      // Reverse the account balances
      await recordTransfer({
        debitAccount: toDelete.creditAccount.toString(),
        creditAccount: toDelete.debitAccount.toString(),
        amount: toDelete.amount,
        session
      });

      // Remove the ledger entries
      const [debitWh, creditWh] = await Promise.all([
        Warehouse.findOne({ cashAccount: toDelete.debitAccount }).select("_id").lean(),
        Warehouse.findOne({ cashAccount: toDelete.creditAccount }).select("_id").lean()
      ]);

      if (debitWh?._id) {
        await Ledger.deleteOne({
          type: "MONEY_TRANSFER",
          date: new Date(toDelete.transferDate),
          amount: toDelete.amount, // Original debit entry (positive in original code)
          warehouse: debitWh._id
        }).session(session);
      }
      if (creditWh?._id) {
        await Ledger.deleteOne({
          type: "MONEY_TRANSFER",
          date: new Date(toDelete.transferDate),
          amount: -toDelete.amount, // Credit entry (if exists)
          warehouse: creditWh._id
        }).session(session);
      }

      // Delete the transfer record
      await MoneyTransfer.findByIdAndDelete(req.params.id).session(session);

      return res.status(200).json({ success: true, message: "Transfer deleted" });
    });
  } catch (err) {
    console.error("Error deleting transfer:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};