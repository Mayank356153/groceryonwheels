const Quotation = require("../models/Quotation");
const Warehouse = require("../models/warehouseModel");
const Customer = require("../models/customerDataModel");
const Item = require("../models/itemModel");

exports.createQuotation = async (req, res) => {
  try {
    const {
      warehouse,
      customer,
      quotationCode,
      quotationDate,
      expiryDate,
      referenceNo,
      items,
      otherCharges,
      note,
      status,
    } = req.body;

    
    if (!warehouse || !customer || !quotationCode || !items?.length) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    
    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      return res.status(404).json({ message: "Warehouse not found!" });
    }

    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: "Customer not found!" });
    }

    
    let totalSubtotal = 0;
    let validItems = [];

    for (const it of items) {
      const itemDoc = await Item.findById(it.item);
      if (!itemDoc) {
        return res.status(404).json({ message: `Item not found: ${it.item}` });
      }

      
      const lineSubtotal =
        (it.unitPrice - (it.discount || 0) + (it.taxAmount || 0)) *
        it.quantity;

      totalSubtotal += lineSubtotal;

      validItems.push({
        item: itemDoc._id,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount || 0,
        taxAmount: it.taxAmount || 0,
        subtotal: lineSubtotal,
      });
    }

    
    let grandTotal = totalSubtotal + (otherCharges || 0);

    
    const newQuotation = new Quotation({
      warehouse,
      customer,
      quotationCode,
      quotationDate: quotationDate || new Date(),
      expiryDate: expiryDate || null,
      referenceNo: referenceNo || "",
      items: validItems,
      otherCharges: otherCharges || 0,
      note: note || "",
      subtotal: totalSubtotal,
      grandTotal,
      status: status || "Draft",
    });

    await newQuotation.save();
    res.status(201).json({ message: "Quotation created successfully!", quotation: newQuotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate("warehouse customer")
      .populate({
        path: "items.item",
        
      });

    res.status(200).json(quotations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate("warehouse customer")
      .populate({
        path: "items.item",
      });
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found!" });
    }
    res.status(200).json(quotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedQuotation = await Quotation.findByIdAndUpdate(id, req.body, {
      new: true,
    })
      .populate("warehouse customer")
      .populate({
        path: "items.item",
      });
    if (!updatedQuotation) {
      return res.status(404).json({ message: "Quotation not found!" });
    }
    res.status(200).json({ message: "Quotation updated successfully!", quotation: updatedQuotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found!" });
    }
    await Quotation.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Quotation deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
