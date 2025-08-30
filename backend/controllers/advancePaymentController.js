const AdvancePayment = require('../models/AdvancePaymentModel');
const CustomerData = require('../models/customerDataModel');
const PaymentType = require('../models/paymentTypeModel');


exports.createAdvancePayment = async (req, res) => {
  try {
    const { date, customer, amount, paymentType, note } = req.body;

    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    
    req.body.createdBy = req.user.id;
    req.body.createdByModel = req.user.role.toLowerCase() === "admin" ? "Admin" : "User";

    const newPayment = new AdvancePayment({
      date,
      customer,
      amount,
      paymentType,
      note,
      createdBy: req.body.createdBy,
      createdByModel: req.body.createdByModel,
    });

    await newPayment.save();
    return res.status(201).json({ message: 'Advance Payment added successfully', data: newPayment });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Advance Payments
exports.getAllAdvancePayments = async (req, res) => {
  try {
    const payments = await AdvancePayment.find()
      .sort({ date: -1 })
      .populate('customer', 'customerName')  // populate customerData (assuming field name is customerName)
      .populate('paymentType', 'paymentTypeName')
      .populate("createdBy", "name FirstName LastName email"); // populate dynamic createdBy

    
    const processedPayments = payments.map(payment => {
      let creatorName = "";
      if (payment.createdBy) {
        if (payment.createdByModel === "Admin" && payment.createdBy.name) {
          creatorName = payment.createdBy.name;
        } else if (payment.createdBy.FirstName && payment.createdBy.LastName) {
          creatorName = `${payment.createdBy.FirstName} ${payment.createdBy.LastName}`;
        }
      }
      return { ...payment.toObject(), creatorName };
    });

    return res.status(200).json({ data: processedPayments });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Advance Payment
exports.updateAdvancePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPayment = await AdvancePayment.findByIdAndUpdate(id, req.body, { new: true })
      .populate('customer', 'customerName')
      .populate('paymentType', 'paymentTypeName')
      .populate("createdBy", "name FirstName LastName email");
    if (!updatedPayment) return res.status(404).json({ message: 'Payment not found' });

    // Process to add computed creatorName
    let creatorName = "";
    if (updatedPayment.createdBy) {
      if (updatedPayment.createdByModel === "Admin" && updatedPayment.createdBy.name) {
        creatorName = updatedPayment.createdBy.name;
      } else if (updatedPayment.createdBy.FirstName && updatedPayment.createdBy.LastName) {
        creatorName = `${updatedPayment.createdBy.FirstName} ${updatedPayment.createdBy.LastName}`;
      }
    }
    const processedPayment = { ...updatedPayment.toObject(), creatorName };

    return res.status(200).json({ message: 'Payment updated successfully', data: processedPayment });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Advance Payment
exports.deleteAdvancePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPayment = await AdvancePayment.findByIdAndDelete(id);
    if (!deletedPayment) return res.status(404).json({ message: 'Payment not found' });

    return res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
