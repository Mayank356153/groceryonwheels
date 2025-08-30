import React, { useState } from 'react';
import EscPosEncoder from '../utils/escposEncoder';

/**
 * React component to connect and print to any Bluetooth ESC‑POS printer.
 * 
 * • Web (Android Chrome) via Web Bluetooth: dynamically discovers a writable characteristic.
 * • Hybrid (Cordova/Capacitor) via cordova-plugin-bluetooth-serial.
 *
 * Props:
 *   rows      – Array of { itemName, quantity, salesPrice }
 *   storeInfo – { storeName: string }
 */
export default function BluetoothPrinterConnector({ rows = [], storeInfo = {} }) {
  const [characteristic, setCharacteristic] = useState(null);
  const [usingBLE, setUsingBLE] = useState(false);

  // 1️⃣ Connect: BLE dynamic discovery or Classic SPP fallback
  async function connectPrinter() {
    // BLE path
    if (navigator.bluetooth) {
      try {
        // show all devices so we can connect to any BLE printer
        const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
        const server = await device.gatt.connect();

        // discover a writable characteristic
        const services = await server.getPrimaryServices();
        let writeChar = null;
        for (const svc of services) {
          const chars = await svc.getCharacteristics();
          for (const ch of chars) {
            if (ch.properties.write || ch.properties.writeWithoutResponse) {
              writeChar = ch;
              break;
            }
          }
          if (writeChar) break;
        }

        if (!writeChar) {
          throw new Error('No writable characteristic found');
        }

        setCharacteristic(writeChar);
        setUsingBLE(true);
        alert('Connected via Web Bluetooth');
      } catch (err) {
        console.error(err);
        alert('BLE connection failed: ' + err.message);
      }

    // Classic SPP fallback
    } else if (window.bluetoothSerial) {
      window.bluetoothSerial.list(
        devices => {
          const target = devices[0]; // pick first device or apply your filter
          window.bluetoothSerial.connect(
            target.id,
            () => {
              setUsingBLE(false);
              alert('Connected via Bluetooth Serial');
            },
            err => alert('SPP connect failed: ' + err)
          );
        },
        err => alert('Device list failed: ' + err)
      );
    } else {
      alert('Bluetooth API not supported');
    }
  }

  // 2️⃣ Print: build ESC‑POS and send
  async function printReceipt() {
    if (!characteristic && !window.bluetoothSerial) {
      alert('Printer not connected');
      return;
    }

    // build ESC‑POS commands
    const encoder = new EscPosEncoder();
    let data = encoder.initialize()
      .align('ct')
      .line(storeInfo.storeName || 'Receipt')
      .newline();

    rows.forEach(r => {
      const line = `${r.itemName}`;
      const amount = (r.quantity * r.salesPrice).toFixed(2);
      data = data.leftRight(line, amount).newline();
    });

    data = data.cut().encode(); // Uint8Array

    if (usingBLE && characteristic) {
      try {
        await characteristic.writeValue(data);
        alert('Printed via BLE');
      } catch (err) {
        console.error(err);
        alert('BLE write failed: ' + err.message);
      }
    } else {
      // Classic SPP write
      try {
        await new Promise((res, rej) => {
          window.bluetoothSerial.write(data.buffer,
            () => res(),
            e => rej(e)
          );
        });
        alert('Printed via SPP');
      } catch (err) {
        console.error(err);
        alert('SPP write failed: ' + err);
      }
    }
  }

  // 3️⃣ Disconnect
  function disconnectPrinter() {
    if (usingBLE && characteristic && characteristic.service.device.gatt.connected) {
      characteristic.service.device.gatt.disconnect();
      alert('BLE printer disconnected');
    } else if (window.bluetoothSerial) {
      window.bluetoothSerial.disconnect();
      alert('Bluetooth Serial disconnected');
    }
    setCharacteristic(null);
    setUsingBLE(false);
  }

  return (
    <div className="flex gap-4">
      <button onClick={connectPrinter} className="px-4 py-2 bg-blue-600 text-white rounded">Connect</button>
      <button onClick={printReceipt} className="px-4 py-2 bg-green-600 text-white rounded" disabled={!characteristic && !window.bluetoothSerial}>Print</button>
      <button onClick={disconnectPrinter} className="px-4 py-2 bg-red-600 text-white rounded" disabled={!characteristic && !window.bluetoothSerial}>Disconnect</button>
    </div>
  );
}
