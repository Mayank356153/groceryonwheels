import { useEffect, useRef, useState } from "react";
import Input from "../contact/Input";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBarcode } from "@fortawesome/free-solid-svg-icons";

const addUnique = (arr = [], code = "") => {
  const trimmed = code.trim();
  return trimmed && !arr.includes(trimmed) ? [...arr, trimmed] : arr;
};


const removeAt = (arr = [], i) => arr.filter((_, idx) => idx !== i);



const Scanner = ({ formData = {}, setFormData, fieldName = "barcodes" }) => {

  const [scanning, setScanning] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const videoRef       = useRef(null);
  const codeReaderRef  = useRef(null);

  const barcodes = formData[fieldName] || [];

  const pushCode = (code) =>
    setFormData((prev) => ({
      ...prev,
      [fieldName]: addUnique(prev[fieldName], code),
    }));



 const handleChange = (e) => {
  if (scanning) return; // skip if camera scanner active
  let value = e.target.value;
  if (value.endsWith(",")) {
    pushCode(value.slice(0, -1));
    value = "";
  }
  setInputValue(value);
};

const handleKeyDown = (e) => {
  if (scanning) return;
  if (e.key === "Enter") {
    e.preventDefault();
    pushCode(inputValue);
    setInputValue("");
  }
};

const handleBlur = () => {
  if (scanning) return;
  pushCode(inputValue);
  setInputValue("");
};




  const handleDelete = (idx) =>
    setFormData((prev) => ({
      ...prev,
      [fieldName]: removeAt(prev[fieldName], idx),
    }));



  useEffect(() => {
    if (!scanning) return;

    const stopScanner = () => {
      videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
      codeReaderRef.current?.reset?.();
      setScanning(false);
    };

    const startScanner = async () => {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const decode = (facingMode) =>
        codeReader.decodeFromConstraints(
          { video: { facingMode } },
          videoRef.current,
          (result, err) => {
            if (result) {
              pushCode(result.getText());
              window.navigator?.vibrate?.(160);
              try {
                new Audio("/beep.mp3").play();
              } catch {}
              stopScanner();
            }

            if (err && err.name !== "NotFoundException")
              console.error("Scan error:", err);
          }
        );

      try {
        await decode({ exact: "environment" });   // back cam first
      } catch {
        try {
          await decode("user");                   // fallback front cam
        } catch (e) {
          console.error("Camera error:", e);
          stopScanner();
        }
      }
    };

    startScanner();


    return () => stopScanner();
  }, [scanning]); 


  return (
    <div className="flex flex-col items-start w-full">
      {/* text input + scan button */}
      <div className="flex items-start w-full">
        <Input
          label="Barcodes"
          placeholder="Type or scan – comma or Enter to save"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          div_class="flex flex-col w-full"
          className="w-full px-4 py-2 mt-1 text-sm text-gray-800 bg-white
                     border-2 border-gray-300 rounded-l-md focus:border-blue-600"
          label_class="text-sm font-semibold"
        />
        <FontAwesomeIcon
          icon={faBarcode}
          title="Scan barcode"
          onClick={() => setScanning(true)}
          className="px-3 mt-4 py-[10px] text-gray-800 bg-gray-100 border-2
                     border-l-0 border-gray-300 rounded-r-md cursor-pointer"
        />
      </div>

      {/* chip list with delete buttons */}
      {barcodes.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {barcodes.map((code, idx) => (
            <span
              key={idx}
              className="flex items-center px-2 py-1 text-xs bg-gray-200 rounded-full"
            >
              {code}
              <button
                type="button"
                className="ml-1 text-red-600 hover:text-red-800 focus:outline-none"
                onClick={() => handleDelete(idx)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* full-screen scanner modal */}
      {scanning && (
        <div className="absolute inset-0 z-50 flex flex-col items-center
                        justify-center bg-black bg-opacity-50">
          <div className="relative overflow-hidden border-4 border-white
                          rounded-lg shadow-xl w-72 h-72">
            <video
              ref={videoRef}
              className="absolute object-cover w-full h-full"
              autoPlay muted playsInline
            />
            <div className="absolute w-full h-1 bg-red-500 animate-scan" />
          </div>
          <button
            onClick={() => setScanning(false)}
            className="px-4 py-2 mt-6 text-white bg-red-600 rounded hover:bg-red-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

/* ---------- sensible defaults ----------------------------------- */
Scanner.defaultProps = {
  formData: { barcodes: [] },
  setFormData: () => {},
  fieldName: "barcodes",
};

export default Scanner;
