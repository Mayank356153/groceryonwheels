// // const express = require("express");
// // const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");
// // const escpos = require('escpos');
// // const { SerialPort } = require('serialport');

// // // Bind escpos to use serial port
// // escpos.SerialPort = require('escpos-serialport');

// // const router = express.Router();


// // // async function findPrinterPort(printerKeyword = 'printer') {
// // //   const ports = await SerialPort.list();
// // //    console.log(ports)
// // //   for (const port of ports) {
// // //     const name = (port.friendlyName || port.manufacturer || '').toLowerCase();
// // //     if (name.includes(printerKeyword.toLowerCase())) {
// // //       console.log(`[Printer Found] Using port: ${port.path}`);
// // //       return port.path; // e.g., COM5 or /dev/rfcomm0
// // //     }
// // //   }

// // //   throw new Error('No matching Bluetooth thermal printer found.');
// // // }

// // async function findPrinterPort() {
// //   const ports = await SerialPort.list();

// //   // Option A: Return the first Bluetooth port (risky if multiple devices)
// //   const bluetoothPort = ports.find(port => 
// //     port.friendlyName.includes('Bluetooth')
// //   );
// //   if (bluetoothPort) return bluetoothPort.path;

// //   // Option B: Manually check which COM port works (trial & error)
// //   for (const port of ports) {
// //     console.log(`Trying port: ${port.path}`);
// //     try {
// //       const device = new escpos.SerialPort(port.path, { baudRate: 9600 });
// //       const printer = new escpos.Printer(device);
// //       // Test print a small message
// //       await new Promise((resolve) => {
// //         device.open(() => {
// //           printer.text("Printer test").cut().close(resolve);
// //         });
// //       });
// //       console.log(`✅ Printer found on ${port.path}`);
// //       return port.path;
// //     } catch (err) {
// //       console.log(`❌ Failed on ${port.path}: ${err.message}`);
// //     }
// //   }

// //   throw new Error('No working printer found.');
// // }


// // async function printReceipt(templateName, data) {
// //   const port = await findPrinterPort('printer'); // or part of your printer's name
// //   const device = new escpos.SerialPort(port, { baudRate: 9600 });
// //   const printer = new escpos.Printer(device);

// //   return new Promise((resolve, reject) => {
// //     device.open(() => {
// //       if (!templates[templateName]) {
// //         reject(new Error(`Template '${templateName}' not found`));
// //         return;
// //       }

// //       templates[templateName](printer, data);
// //       printer.cut().close();
// //       resolve();
// //     });
// //   });
// // }
// const express = require("express");
// const escpos = require('escpos');
// escpos.Serial = require('escpos-serialport');

// const router = express.Router();

// async function findPrinterPort() {
//   // Use escpos-serialport's built-in list function
//   const ports = await new Promise((resolve, reject) => {
//     escpos.Serial.list((err, ports) => {
//       if (err) reject(err);
//       resolve(ports);
//     });
//   });

//   // Try to find a Bluetooth printer
//   const printerPort = ports.find(port => 
//     port.manufacturer?.toLowerCase().includes('printer') || 
//     port.friendlyName?.toLowerCase().includes('bluetooth')
//   );

//   if (!printerPort) {
//     console.log('Available ports:', ports);
//     throw new Error('No printer found. Connected devices: ' + 
//       ports.map(p => p.friendlyName || p.path).join(', '));
//   }

//   return printerPort.path;
// }

// async function printReceipt(templateName, data) {
//   const portPath = await findPrinterPort();
  
//   // Create device using escpos-serialport
//   const device = new escpos.Serial(portPath, {
//     baudRate: 9600,
//     autoOpen: false
//   });

//   const printer = new escpos.Printer(device);

//   return new Promise((resolve, reject) => {
//     device.open(async (error) => {
//       if (error) {
//         console.error('Failed to open port:', error);
//         return reject(error);
//       }

//       try {
//         if (!templates[templateName]) {
//           throw new Error(`Template '${templateName}' not found`);
//         }

//         templates[templateName](printer, data);
//         printer.cut();
//         device.close(resolve);
//       } catch (e) {
//         device.close(() => reject(e));
//       }
//     });
//   });
// }

// // ... keep your existing templates and routes ...

// const templates = {
//   sale: (printer, data) => {
//     const {
//     saleCode,
//     saleDate,
//     customer,
//     warehouse,
//     items,
//     subtotal,
//     grandTotal,
//     payments,
//     discountOnBill,
//     otherCharges,
//   } = data;

//   printer
//     .align('CT')
//     .style('B')
//     .size(1, 1)
//     .text('** SALES RECEIPT **')
//     .text(`Sale No: ${saleCode}`)
//     .text(`Date: ${new Date(saleDate).toLocaleString()}`)
//     .text(`Customer: ${customer?.name || 'N/A'}`)
//     .text(`Warehouse: ${warehouse?.name || 'N/A'}`)
//     .text('-----------------------------')
//     .align('LT');

//   // Print Items
//   items.forEach((item, index) => {
//     const itemName = item.item?.itemName || `Item ${index + 1}`;
//     const qty = item.quantity;
//     const price = item.unitPrice.toFixed(2);
//     const total = item.subtotal.toFixed(2);
//     printer.text(`${itemName}`);
//     printer.text(`  ${qty} x ₹${price} = ₹${total}`);
//   });

//   printer.text('-----------------------------');

//   if (discountOnBill) {
//     printer.text(`Discount on Bill: -₹${discountOnBill.toFixed(2)}`);
//   }
//   if (otherCharges) {
//     printer.text(`Other Charges: ₹${otherCharges.toFixed(2)}`);
//   }

//   printer
//     .style('B')
//     .text(`Subtotal: ₹${subtotal.toFixed(2)}`)
//     .text(`Grand Total: ₹${grandTotal.toFixed(2)}`)
//     .text('-----------------------------')
//     .text('Payments:')
//     .style('NORMAL');

//   payments.forEach((p, i) => {
//     const method = p.paymentType?.name || 'Unknown';
//     printer.text(`- ₹${p.amount.toFixed(2)} via ${method}`);
//   });

//   printer
//     .text('-----------------------------')
//     .align('CT')
//     .text('Thank you for your purchase!')
//     .feed(3); // adds some space after
//   },


  
//   purchase: (printer, data) => {
//     printer
//       .align('ct')
//       .style('b')
//       .text('--- PURCHASE RECEIPT ---')
//       .text(`Supplier: ${data.supplier}`)
//       .text(`Items: ${data.items}`)
//       .text(`Total Cost: ₹${data.amount}`)
//       .text('Received with thanks!');
//   }
// };


// router.post("/",async(req,res)=>{
//      const { template, data } = req.body;

//   try {
//     await printReceipt(template, data);
//     res.send('🖨️ Print successful!');
//   } catch (err) {
//     console.error('[Print Error]', err);
//     res.status(500).send(`❌ Print failed: ${err.message}`);
//   }
// })


// module.exports = router;
// routes/printRoutes.js







//new






// const express = require("express");
// const escpos = require("escpos");
// escpos.Serial = require("escpos-serialport");
// // With this:
// const { SerialPort } = require('serialport');





// const router = express.Router();

// // Template logic — you can add more
// const templates = {
//   simpleReceipt: (printer, data) => {
//     printer
//       .align("CT")
//       .style("B")
//       .size(1, 1)
//       .text("🧾 Sales Receipt")
//       .text("------------------------------")
//       .align("LT")
//       .text(`Customer: ${data.customer}`)
//       .text(`Date: ${data.date}`)
//       .text("------------------------------");

//     data.items.forEach((item, index) => {
//       printer.text(`${index + 1}. ${item.name} x${item.qty} = ₹${item.total}`);
//     });

//     printer
//       .text("------------------------------")
//       .text(`Subtotal: ₹${data.subtotal}`)
//       .text(`Tax: ₹${data.tax}`)
//       .text(`Grand Total: ₹${data.total}`)
//       .text("------------------------------")
//       .align("CT")
//       .text("🙏 Thank you for shopping!");
//   }
// };






// async function findPrinterPort() {
//   try {
//     // Updated syntax for serialport v10+
//     const ports = await SerialPort.list();
//     console.log('Detected ports:', ports);
    
//     const printer = ports.find(p =>
//       (p.manufacturer || '').toLowerCase().includes('printer') ||
//       (p.path || '').toLowerCase().includes('com')
//     );
    
//     if (!printer) throw new Error('No matching printer found.');
//     return printer.path;
//   } catch (error) {
//     console.error('Port detection error:', error);
//     throw new Error('Failed to detect printer ports');
//   }
// }








// // Main print logic
// async function printReceipt(templateName, data) {
//   const portPath = await findPrinterPort();

//   const device = new escpos.Serial(portPath, {
//     baudRate: 9600,
//     autoOpen: false
//   });

//   const printer = new escpos.Printer(device);

//   return new Promise((resolve, reject) => {
//     device.open(error => {
//       if (error) return reject("Failed to open printer: " + error.message);

//       try {
//         if (!templates[templateName])
//           throw new Error(`Template '${templateName}' not found`);

//         templates[templateName](printer, data);
//         printer.cut();

//         printer.close(() => resolve("🖨️ Print successful"));
//       } catch (e) {
//         device.close(() => reject("Print error: " + e.message));
//       }
//     });
//   });
// }






// // Express route: POST /api/print
// router.post("/", async (req, res) => {
//   try {
//     const { template, data } = req.body;

//     const result = await printReceipt(template, data);
//     res.json({ success: true, message: result });
//   } catch (error) {
//     console.error("[Print Error]", error.message);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// module.exports = router;


//next



const express = require("express");
const escpos = require("escpos");
escpos.Serial = require("escpos-serialport");
const  SerialPort  = require("serialport");

const router = express.Router();

// 🔍 Detect paired & connected printer port dynamically
async function findConnectedPrinterPort() {
  const ports = await SerialPort.list();
  console.log("Available Ports:", ports);

  const printerPort = ports.find(p =>
    (p.manufacturer && p.manufacturer.toLowerCase().includes("printer")) ||
    p.path.toLowerCase().includes("com") ||   // Windows COM ports
    p.path.toLowerCase().includes("rfcomm")   // Linux Bluetooth port
  );

  if (!printerPort) {
    throw new Error("No printer found. Make sure it is paired and connected.");
  }

  return printerPort.path; // e.g., COM5, /dev/rfcomm0
}

// 🖨️ Print Logic
async function printReceipt(templateName, data) {
  const portPath = await findConnectedPrinterPort(); // Dynamically detected path
  const device = new escpos.Serial(portPath, { baudRate: 9600 });
  const printer = new escpos.Printer(device);

  return new Promise((resolve, reject) => {
    device.open(err => {
      if (err) return reject("Printer connection failed: " + err.message);

      // 🔄 Use selected template
      if (!templates[templateName]) {
        return reject("Template not found: " + templateName);
      }

      templates[templateName](printer, data);

      printer.cut().close(() => resolve("✅ Printed successfully"));
    });
  });
}

// 🧾 Templates
const templates = {
  sale: (printer, data) => {
    const {
      saleCode, saleDate, customer, warehouse,
      items, subtotal, grandTotal, payments,
      discountOnBill, otherCharges
    } = data;

    printer
      .align("CT")
      .style("B")
      .size(1, 1)
      .text("** SALES RECEIPT **")
      .text(`Sale No: ${saleCode}`)
      .text(`Date: ${new Date(saleDate).toLocaleString()}`)
      .text(`Customer: ${customer?.name || "N/A"}`)
      .text(`Warehouse: ${warehouse?.name || "N/A"}`)
      .text("-----------------------------")
      .align("LT");

    items.forEach((item, index) => {
      const itemName = item.item?.itemName || `Item ${index + 1}`;
      const qty = item.quantity;
      const price = item.unitPrice.toFixed(2);
      const total = item.subtotal.toFixed(2);
      printer.text(`${itemName}`);
      printer.text(`  ${qty} x ₹${price} = ₹${total}`);
    });

    printer.text("-----------------------------");

    if (discountOnBill) {
      printer.text(`Discount on Bill: -₹${discountOnBill.toFixed(2)}`);
    }
    if (otherCharges) {
      printer.text(`Other Charges: ₹${otherCharges.toFixed(2)}`);
    }

    printer
      .style("B")
      .text(`Subtotal: ₹${subtotal.toFixed(2)}`)
      .text(`Grand Total: ₹${grandTotal.toFixed(2)}`)
      .text("-----------------------------")
      .text("Payments:")
      .style("NORMAL");

    payments.forEach((p) => {
      const method = p.paymentType?.name || "Unknown";
      printer.text(`- ₹${p.amount.toFixed(2)} via ${method}`);
    });

    printer
      .text("-----------------------------")
      .align("CT")
      .text("Thank you for your purchase!")
      .feed(3);
  },

  purchase: (printer, data) => {
    printer
      .align("CT")
      .style("B")
      .text("--- PURCHASE RECEIPT ---")
      .text(`Supplier: ${data.supplier}`)
      .text(`Items: ${data.items}`)
      .text(`Total Cost: ₹${data.amount}`)
      .text("Received with thanks!")
      .feed(3);
  }
};

// 🧾 API Endpoint
router.post("/", async (req, res) => {
  try {
    const { template, data } = req.body;
    const message = await printReceipt(template, data);
    res.json({ success: true, message });
  } catch (error) {
    console.error("[Print Error]", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
});

module.exports = router;
