const Account = require("../models/accountModel");
const Store = require('../models/storeModel');

// controllers/accountController.js
exports.createAccount = async (req, res) => {
  try {
    let {
      parentAccount: incomingParent,
      accountNumber,
      accountName,
      openingBalance,
      note,
      // only admins may send this:
      store: incomingStore
    } = req.body;

    /* ─────────────────────────────────────────────────────────
       1) Decide which store we’re working with
    ───────────────────────────────────────────────────────────*/
    let storeId;
    if (req.user.role.toLowerCase() === 'admin' && incomingStore) {
      // admin explicitly targeted a store
      storeId = incomingStore;
    } else {
      // store-user (or admin without “store”) → take first store in token
      storeId = Array.isArray(req.user.stores)
        ? req.user.stores[0]
        : req.user.store;
    }

    /* 🔸  If neither a store nor a parentAccount was supplied this is
            a ROOT-ACCOUNT creation request (step 1 in your workflow).
            → allow, skip all store validation.                           */
    const creatingRoot = !storeId && !incomingParent;

    if (!creatingRoot && !storeId) {
      return res
        .status(400)
        .json({ success: false, message: 'Store is required' });
    }

    /* ─────────────────────────────────────────────────────────
       2) Determine parentAccount
    ───────────────────────────────────────────────────────────*/
    let parentAccount = incomingParent;

    if (!creatingRoot) {
      // we *do* have a store context here
      const store = await Store.findById(storeId);
      if (!store) throw new Error('Invalid store ID');

      // a) no parent given → use the store’s main/root account
      if (!parentAccount) {
        parentAccount = store.storeAccount;
      } else {
        // b) parent given → verify it belongs to the same store
        const acct = await Account.findById(parentAccount);
        if (!acct || String(acct.parentAccount) !== String(store.storeAccount)) {
          return res
            .status(400)
            .json({ success: false, message: 'Invalid parent account' });
        }
      }
    } else {
      // creatingRoot  ➜ parentAccount stays null
      parentAccount = null;
    }

    /* ─────────────────────────────────────────────────────────
       3) Create & save
    ───────────────────────────────────────────────────────────*/
    const newAccount = new Account({
      parentAccount,
      accountNumber,
      accountName,
      openingBalance: openingBalance || 0,
      note: note || '',
      createdBy: req.user.id,
      createdByModel:
        req.user.role.toLowerCase() === 'admin' ? 'Admin' : 'User'
    });

    const saved = await newAccount.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET all Accounts with creatorName populated
exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find()
      .populate("parentAccount", "accountName accountNumber")
      .populate("createdBy", "name FirstName LastName"); // populate createdBy if available

    // Compute creatorName for each account
    const processedAccounts = accounts.map((account) => {
      let creatorName = "";
      if (account.createdBy) {
        if (account.createdBy.name) {
          creatorName = account.createdBy.name;
        } else if (account.createdBy.FirstName && account.createdBy.LastName) {
          creatorName = `${account.createdBy.FirstName} ${account.createdBy.LastName}`;
        }
      }
      return { ...account.toObject(), creatorName };
    });

    return res.status(200).json({ success: true, data: processedAccounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET single Account by ID with creatorName populated
exports.getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate("parentAccount", "accountName accountNumber")
      .populate("createdBy", "name FirstName LastName"); // populate createdBy if available

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    let creatorName = "";
    if (account.createdBy) {
      if (account.createdBy.name) {
        creatorName = account.createdBy.name;
      } else if (account.createdBy.FirstName && account.createdBy.LastName) {
        creatorName = `${account.createdBy.FirstName} ${account.createdBy.LastName}`;
      }
    }

    return res.status(200).json({ success: true, data: { ...account.toObject(), creatorName } });
  } catch (error) {
    console.error("Error fetching account:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Account
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { parentAccount, accountNumber, accountName, openingBalance, note, status } = req.body;

    if (parentAccount) {
      const parent = await Account.findById(parentAccount);
      if (!parent) {
        return res.status(400).json({ success: false, message: "Invalid parent account" });
      }
    }

    const updated = await Account.findByIdAndUpdate(
      id,
      { parentAccount, accountNumber, accountName, openingBalance, note, status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Account updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating account:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Account
exports.deleteAccount = async (req, res) => {
  try {
    const deleted = await Account.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    return res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
