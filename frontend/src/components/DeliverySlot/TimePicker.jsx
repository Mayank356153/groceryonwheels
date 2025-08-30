import { useState, useRef, useEffect } from 'react';

const TimePicker = ({ label, value, onChange, minTime }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState('AM');
  const timePickerRef = useRef(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [time, mod] = value.split(' ');
      const [h, m] = time.split(':');
      setHours(h.padStart(2, '0'));
      setMinutes(m.padStart(2, '0'));
      setPeriod(mod || 'AM');
    }
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timePickerRef.current && !timePickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimeChange = (newHours, newMinutes, newPeriod) => {
    const formattedTime = `${newHours}:${newMinutes} ${newPeriod}`;
    onChange(formattedTime);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={timePickerRef}>
      <label className="block mb-1 text-sm font-medium text-gray-700">
        {label}
      </label>
      <div
        className="flex items-center justify-between px-4 py-3 transition-colors bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-800">
          {value || 'Select time'}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="flex p-4 border-b bg-gray-50">
            <div className="flex-1 text-lg font-medium text-center text-gray-800">
              {hours}:{minutes} {period}
            </div>
          </div>
          
          <div className="flex divide-x divide-gray-200">
            {/* Hours */}
            <div className="flex-1 py-2 overflow-y-auto max-h-48">
              {Array.from({ length: 12 }, (_, i) => {
                const h = (i + 1).toString().padStart(2, '0');
                return (
                  <div
                    key={`hour-${h}`}
                    className={`px-4 py-2 text-center cursor-pointer hover:bg-blue-50 ${
                      hours === h ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                    }`}
                    onClick={() => setHours(h)}
                  >
                    {h}
                  </div>
                );
              })}
            </div>
            
            {/* Minutes */}
            <div className="flex-1 py-2 overflow-y-auto max-h-48">
              {Array.from({ length: 60 }, (_, i) => {
                const m = i.toString().padStart(2, '0');
                return (
                  <div
                    key={`minute-${m}`}
                    className={`px-4 py-2 text-center cursor-pointer hover:bg-blue-50 ${
                      minutes === m ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                    }`}
                    onClick={() => setMinutes(m)}
                  >
                    {m}
                  </div>
                );
              })}
            </div>
            
            {/* AM/PM */}
            <div className="flex-1 py-2">
              {['AM', 'PM'].map((p) => (
                <div
                  key={`period-${p}`}
                  className={`px-4 py-2 text-center cursor-pointer hover:bg-blue-50 ${
                    period === p ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                  }`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end p-3 border-t bg-gray-50">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 ml-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              onClick={() => handleTimeChange(hours, minutes, period)}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;