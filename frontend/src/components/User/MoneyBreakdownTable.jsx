import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'react-feather';

const MoneyBreakdownTable = ({ 
  breakdownData, 
  title = 'Money Breakdown', 
  showTotal = true,
  onClose,
  isOpen = true
}) => {
  // Close when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const totalAmount = breakdownData?.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-gray-50">
              <motion.h2 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-gray-800"
              >
                {title}
              </motion.h2>
              
              {showTotal && (
                <div className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm">
                  <span className="mr-2 text-gray-600">Total:</span>
                  <span className="text-xl font-semibold text-blue-600">
                    {totalAmount}
                  </span>
                </div>
              )}

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 transition-all rounded-full hover:text-gray-800 hover:bg-gray-100"
                  title="Close"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Content area */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
              {!breakdownData?.length ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="text-lg text-gray-400">No breakdown data available</div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="divide-y divide-gray-100"
                >
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Amount
                        </th>
                       
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {breakdownData?.map((item, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="transition-colors hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.reason}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.amount
                              }
                            </div>
                          </td>
                          
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MoneyBreakdownTable;