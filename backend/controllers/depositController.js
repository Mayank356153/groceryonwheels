
require("dotenv").config();
const mongoose        = require("mongoose");
const Deposit         = require("../models/depositModel");
const Warehouse       = require("../models/warehouseModel");
const Ledger          = require("../models/ledgerModel");
const { recordTransfer } = require("../services/recordTransfer");

exports.createDeposit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      depositDate,
      referenceNo,
      debitAccount,
      creditAccount,
      amount,
      note
    } = req.body;

    // 1️⃣ Validate
    if (!depositDate || !debitAccount || !creditAccount || !amount) {
      throw new Error("Missing required fields");
    }
    if (debitAccount === creditAccount) {
      throw new Error("Debit and credit cannot be the same");
    }

    // 2️⃣ Create the Deposit doc
    const [newDeposit] = await Deposit.create(
      [{
        depositDate,
        referenceNo,
        debitAccount,
        creditAccount,
        amount,
        note,
        createdBy:      req.user?.id,
        createdByModel: req.user
                         ? (req.user.role.toLowerCase() === "admin" ? "Admin" : "User")
                         : null
      }],
      { session }
    );

    // 3️⃣ Adjust both accounts’ balances
    //    debitAccount ↓, creditAccount ↑
    await recordTransfer({
      debitAccount,
      creditAccount,
      amount,
      session
    });

    // 4️⃣ Record in your Ledger
    //    (so cash-summary can pick it up)
    //  – Find the warehouse that owns this cashAccount
    const wh = await Warehouse
  .findOne({ cashAccount: creditAccount })
  .select("_id")
  .lean();
if (!wh?._id) {
  throw new Error("Warehouse not found for this cash account");
}

await Ledger.create([{
  date:      new Date(depositDate),
  type:      "DEPOSIT",
  amount,
  warehouse: wh._id
}], { session });

    // 5️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Deposit created",
      data: newDeposit
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating deposit:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};



// GET All Deposits (with computed creatorName)
// at top of your controller file you already have:
// const Warehouse = require("../models/warehouseModel");
// const Deposit = require("../models/depositModel");
// ...other imports

// GET All Deposits (filtered by user/stores)
exports.getAllDeposits = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = (req.user?.role || "").toLowerCase();

    // admins see everything
    if (role === "admin") {
      const deposits = await Deposit.find()
        .populate("debitAccount", "accountName accountNumber")
        .populate("creditAccount", "accountName accountNumber")
        .populate("createdBy", "FirstName LastName name");
      const processed = deposits.map(d => {
        let creatorName = "";
        if (d.createdBy) {
          if (d.createdBy.name) creatorName = d.createdBy.name;
          else if (d.createdBy.FirstName && d.createdBy.LastName) creatorName = `${d.createdBy.FirstName} ${d.createdBy.LastName}`;
        }
        return { ...d.toObject(), creatorName };
      });
      return res.status(200).json({ success: true, data: processed });
    }

    // find warehouses assigned to this user
    const assigned = await Warehouse.find({ assignedUsers: userId }).select("cashAccount").lean();
    const creditAccountIds = assigned.map(w => (w.cashAccount ? String(w.cashAccount) : null)).filter(Boolean);

    // find deposits that either belong to this user OR are in assigned warehouse accounts
    const deposits = await Deposit.find({
      $or: [
        { createdBy: userId },
        { creditAccount: { $in: creditAccountIds } }
      ]
    })
      .populate("debitAccount", "accountName accountNumber")
      .populate("creditAccount", "accountName accountNumber")
      .populate("createdBy", "FirstName LastName name");

    const processed = deposits.map(d => {
      let creatorName = "";
      if (d.createdBy) {
        if (d.createdBy.name) creatorName = d.createdBy.name;
        else if (d.createdBy.FirstName && d.createdBy.LastName) creatorName = `${d.createdBy.FirstName} ${d.createdBy.LastName}`;
      }
      return { ...d.toObject(), creatorName };
    });

    return res.status(200).json({ success: true, data: processed });
  } catch (error) {
    console.error("Error fetching deposits:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// GET Single Deposit (with computed creatorName)
exports.getDepositById = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id)
      .populate("debitAccount", "accountName accountNumber")
      .populate("creditAccount", "accountName accountNumber")
      .populate("createdBy", "FirstName LastName name");
      
    if (!deposit) {
      return res.status(404).json({ success: false, message: "Deposit not found" });
    }
    
    let creatorName = "";
    if (deposit.createdBy) {
      if (deposit.createdBy.name) {
        creatorName = deposit.createdBy.name;
      } else if (deposit.createdBy.FirstName && deposit.createdBy.LastName) {
        creatorName = `${deposit.createdBy.FirstName} ${deposit.createdBy.LastName}`;
      }
    }
    
    return res.status(200).json({ success: true, data: { ...deposit.toObject(), creatorName } });
  } catch (error) {
    console.error("Error fetching deposit:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDeposit = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id } = req.params;
      const {
        depositDate,
        referenceNo,
        debitAccount,
        creditAccount,
        amount,
        note
      } = req.body;

      // … your existing validation …

      // 1) Load existing deposit
      const old = await Deposit.findById(id).session(session);
      if (!old) throw new Error("Deposit not found");

      // 2) Reverse its old balance movement
      await recordTransfer({
        debitAccount:  old.creditAccount.toString(),
        creditAccount: old.debitAccount.toString(),
        amount:        old.amount,
        session
      });

      // 3) Remove the old ledger entry
      //    (find the warehouse by old.debitAccount)
      const oldWh = await Warehouse.findOne({ cashAccount: old.creditAccount }).select("_id").lean();
      if (oldWh?._id) {
        await Ledger.deleteOne({
          type:      "DEPOSIT",
          date:      new Date(old.depositDate).setHours(0,0,0,0),
          amount:    old.amount,
          warehouse: oldWh._id
        }).session(session);
      }

      // 4) Update the deposit document
      old.depositDate   = depositDate;
      old.referenceNo   = referenceNo;
      old.debitAccount  = debitAccount;
      old.creditAccount = creditAccount;
      old.amount        = amount;
      old.note          = note;
      await old.save({ session });

      // 5) Apply the new movement
      await recordTransfer({
        debitAccount,
        creditAccount,
        amount,
        session
      });

      // 6) Write the new ledger entry
      const newWh = await Warehouse.findOne({ cashAccount: creditAccount }).select("_id").lean();
      if (!newWh?._id) throw new Error("Warehouse not found for new cashAccount");
      await Ledger.create([{
        date:      new Date(depositDate),
        type:      "DEPOSIT",
        amount,
        warehouse: newWh._id
      }], { session });

      // 7) Return the updated deposit (as before)
      const updated = await Deposit.findById(id)
        .populate("debitAccount",  "accountName accountNumber")
        .populate("creditAccount", "accountName accountNumber")
        .populate("createdBy",     "FirstName LastName name")
        .session(session);

      let creatorName = "";
      if (updated.createdBy) {
        creatorName = updated.createdBy.name
          ? updated.createdBy.name
          : `${updated.createdBy.FirstName} ${updated.createdBy.LastName}`;
      }

      res.status(200).json({
        success: true,
        message: "Deposit updated successfully",
        data: { ...updated.toObject(), creatorName }
      });
    });

  } catch (err) {
    console.error("Error updating deposit:", err);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// DELETE Deposit
// DELETE Deposit
exports.deleteDeposit = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const id = req.params.id;

      // 1) Load the deposit
      const deposit = await Deposit.findById(id).session(session);
      if (!deposit) throw new Error("Deposit not found");

      // 2) Reverse its balance effect
      //    (credit back debit, debit back credit)
      await recordTransfer({
        debitAccount:  deposit.creditAccount.toString(),
        creditAccount: deposit.debitAccount.toString(),
        amount:        deposit.amount,
        session
      });

      // 3) Remove the ledger entry for this deposit
      const wh = await Warehouse.findOne({ cashAccount: deposit.creditAccount }).select("_id").lean();
      if (wh?._id) {
        await Ledger.deleteOne({
          type:      "DEPOSIT",
          date:      new Date(deposit.depositDate).setHours(0,0,0,0),
          amount:    deposit.amount,
          warehouse: wh._id
        }).session(session);
      }

      // 4) Finally delete the deposit
      await Deposit.deleteOne({ _id: id }).session(session);
    });

    return res.status(200).json({ success: true, message: "Deposit deleted successfully" });

  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting deposit:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
