// controllers/paymentsController.js
const mongoose  = require("mongoose");
const Sales     = require("../models/Sales");
const PosOrder  = require("../models/PosOrder");

// helper to normalize shape
function formatPayments(docs, source) {
  return docs.map(doc => {
    // assemble creatorName
    const c = doc.createdByDoc || {};
    let creatorName = "";
    if (doc.createdByModel === "Admin" && c.name) {
      creatorName = c.name;
    } else {
      creatorName = [c.FirstName, c.LastName].filter(Boolean).join(" ");
    }

    return {
      saleId:        doc.saleId,
      saleCode:      doc.saleCode,
      customer:      doc.customer,
      paymentCode:   doc.paymentCode,
      paymentDate:   doc.paymentDate,
      paymentType:   doc.paymentType,
      paymentAmount: doc.paymentAmount,
      paymentNote:   doc.paymentNote,
      creatorName,
      source
    };
  });
}

exports.getAllPayments = async (req, res) => {
  try {
    const { paymentType, paymentStatus } = req.query;

    // ─── sales pipeline ───────────────────────────────────────────────
    const salesPipeline = [
      { $unwind: "$payments" },
      {
        $match: {
          ...(paymentType
            ? { "payments.paymentType": new mongoose.Types.ObjectId(paymentType) }
            : {}),
          ...(paymentStatus
            ? { "payments.paymentStatus": paymentStatus }
            : {}),
        }
      },
      // paymentType lookup
      {
        $lookup: {
          from: "paymenttypes",
          localField: "payments.paymentType",
          foreignField: "_id",
          as: "paymentTypeData"
        }
      },
      {
        $addFields: {
          "payments.paymentTypeData": { $arrayElemAt: ["$paymentTypeData", 0] }
        }
      },
      // customer lookup
      {
        $lookup: {
          from: "customerdatas",
          localField: "customer",
          foreignField: "_id",
          as: "customerDoc"
        }
      },
      { $addFields: { customerDoc: { $arrayElemAt: ["$customerDoc", 0] } } },
      // createdBy lookup (users vs admins)
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByUser"
        }
      },
      {
        $lookup: {
          from: "admins",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByAdmin"
        }
      },
      {
        $addFields: {
          createdByDoc: {
            $cond: [
              { $gt: [{ $size: "$createdByUser" }, 0] },
              { $arrayElemAt: ["$createdByUser", 0] },
              { $arrayElemAt: ["$createdByAdmin", 0] }
            ]
          }
        }
      },
      // project exactly the fields we want
      {
        $project: {
          saleId:        "$_id",
          saleCode:      1,
          customer:      "$customerDoc.customerName",
          paymentCode:   "$payments.paymentCode",
          paymentDate:   "$payments.paymentDate",
          paymentType:   "$payments.paymentTypeData.paymentTypeName",
          paymentAmount: "$payments.amount",
          paymentNote:   "$payments.paymentNote",
          createdByModel: 1,
          createdByDoc:   1
        }
      }
    ];

    // ─── POS pipeline ─────────────────────────────────────────────────
    const posPipeline = [
      { $unwind: "$payments" },
      {
        $lookup: {
          from: "paymenttypes",
          localField: "payments.paymentType",
          foreignField: "_id",
          as: "paymentTypeData"
        }
      },
      {
        $addFields: {
          "payments.paymentTypeData": { $arrayElemAt: ["$paymentTypeData", 0] }
        }
      },
      {
        $lookup: {
          from: "customerdatas",
          localField: "customer",
          foreignField: "_id",
          as: "customerDoc"
        }
      },
      { $addFields: { customerDoc: { $arrayElemAt: ["$customerDoc", 0] } } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByUser"
        }
      },
      {
        $lookup: {
          from: "admins",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByAdmin"
        }
      },
      {
        $addFields: {
          createdByDoc: {
            $cond: [
              { $gt: [{ $size: "$createdByUser" }, 0] },
              { $arrayElemAt: ["$createdByUser", 0] },
              { $arrayElemAt: ["$createdByAdmin", 0] }
            ]
          }
        }
      },
      {
        $project: {
          saleId:        "$_id",
          saleCode:      "$saleCode",  // POS uses saleCode as well
          customer:      "$customerDoc.customerName",
          paymentCode:   "$payments.paymentCode",
          paymentDate:   "$payments.paymentDate",
          paymentType:   "$payments.paymentTypeData.paymentTypeName",
          paymentAmount: "$payments.amount",
          paymentNote:   "$payments.paymentNote",
          createdByModel: 1,
          createdByDoc:   1
        }
      }
    ];

    const [salesDocs, posDocs] = await Promise.all([
      Sales.aggregate(salesPipeline),
      PosOrder.aggregate(posPipeline)
    ]);

    const allPayments = [
      ...formatPayments(salesDocs, "sales"),
      ...formatPayments(posDocs,   "pos")
    ]
    // sort newest first
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    res.json(allPayments);
  } catch (err) {
    console.error("getAllPayments error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPaymentsBySaleId = async (req, res) => {
  try {
    const { saleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return res.status(400).json({ message: "Invalid sale ID" });
    }

    const salesPipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(saleId) } },
      { $unwind: "$payments" },
      {
        $lookup: {
          from: "paymenttypes",
          localField: "payments.paymentType",
          foreignField: "_id",
          as: "paymentTypeData"
        }
      },
      {
        $addFields: {
          "payments.paymentTypeData": { $arrayElemAt: ["$paymentTypeData", 0] }
        }
      },
      {
        $lookup: {
          from: "accounts",
          localField: "payments.account",
          foreignField: "_id",
          as: "accountData"
        }
      },
      {
        $addFields: {
          "payments.accountData": { $arrayElemAt: ["$accountData", 0] }
        }
      },
      {
        $lookup: {
          from: "customerdatas",
          localField: "customer",
          foreignField: "_id",
          as: "customerDoc"
        }
      },
      { $addFields: { customerDoc: { $arrayElemAt: ["$customerDoc", 0] } } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByUser"
        }
      },
      {
        $lookup: {
          from: "admins",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByAdmin"
        }
      },
      {
        $addFields: {
          createdByDoc: {
            $cond: [
              { $gt: [{ $size: "$createdByUser" }, 0] },
              { $arrayElemAt: ["$createdByUser", 0] },
              { $arrayElemAt: ["$createdByAdmin", 0] }
            ]
          }
        }
      },
      {
        $project: {
          saleId: "$_id",
          saleCode: 1,
          saleDate: "$saleDate",
          customer: "$customerDoc.customerName",
          paymentCode: "$payments.paymentCode",
          paymentDate: "$payments.paymentDate",
          paymentType: "$payments.paymentTypeData.paymentTypeName",
          paymentAmount: "$payments.amount",
          paymentNote: "$payments.paymentNote",
          accountName: "$payments.accountData.accountName",
          createdByModel: 1,
          createdByDoc: 1,
          totalAmount: "$grandTotal"
        }
      }
    ];

    const posPipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(saleId) } },
      { $unwind: "$payments" },
      {
        $lookup: {
          from: "paymenttypes",
          localField: "payments.paymentType",
          foreignField: "_id",
          as: "paymentTypeData"
        }
      },
      {
        $addFields: {
          "payments.paymentTypeData": { $arrayElemAt: ["$paymentTypeData", 0] }
        }
      },
      {
        $lookup: {
          from: "accounts",
          localField: "payments.account",
          foreignField: "_id",
          as: "accountData"
        }
      },
      {
        $addFields: {
          "payments.accountData": { $arrayElemAt: ["$accountData", 0] }
        }
      },
      {
        $lookup: {
          from: "customerdatas",
          localField: "customer",
          foreignField: "_id",
          as: "customerDoc"
        }
      },
      { $addFields: { customerDoc: { $arrayElemAt: ["$customerDoc", 0] } } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByUser"
        }
      },
      {
        $lookup: {
          from: "admins",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByAdmin"
        }
      },
      {
        $addFields: {
          createdByDoc: {
            $cond: [
              { $gt: [{ $size: "$createdByUser" }, 0] },
              { $arrayElemAt: ["$createdByUser", 0] },
              { $arrayElemAt: ["$createdByAdmin", 0] }
            ]
          }
        }
      },
      {
        $project: {
          saleId: "$_id",
          saleCode: "$saleCode",
          saleDate: "$saleDate",
          customer: "$customerDoc.customerName",
          paymentCode: "$payments.paymentCode",
          paymentDate: "$payments.paymentDate",
          paymentType: "$payments.paymentTypeData.paymentTypeName",
          paymentAmount: "$payments.amount",
          paymentNote: "$payments.paymentNote",
          accountName: "$payments.accountData.accountName",
          createdByModel: 1,
          createdByDoc: 1,
          totalAmount: "$totalAmount"
        }
      }
    ];

    const [salesDocs, posDocs] = await Promise.all([
      Sales.aggregate(salesPipeline),
      PosOrder.aggregate(posPipeline)
    ]);

    const allPayments = [
      ...formatPayments(salesDocs, "sales"),
      ...formatPayments(posDocs, "pos")
    ].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    if (allPayments.length === 0) {
      return res.status(404).json({ message: "No payments found for this sale" });
    }

    const totalPaid = allPayments.reduce((sum, p) => sum + (p.paymentAmount || 0), 0);
    const totalAmount = allPayments[0].totalAmount || 0;

    const response = {
      customer: allPayments[0].customer || "N/A",
      saleCode: allPayments[0].saleCode || "N/A",
      saleDate: allPayments[0].saleDate,
      totalAmount: totalAmount,
      totalPaid: totalPaid,
      payments: allPayments
    };

    res.json(response);
  } catch (err) {
    console.error("getPaymentsBySaleId error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};