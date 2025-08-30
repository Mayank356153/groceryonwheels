import React, { useState } from 'react';
import { X } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';

const AllowedList = ({ coupon, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Check for each restriction type
  const restrictions = {
    items: coupon.itemsAllowed?.length > 0,
    categories: coupon.categoryAllowed?.length > 0,
    subCategories: coupon.subCategoryAllowed?.length > 0,
    subSubCategories: coupon.subsubCategoryAllowed?.length > 0
  };

  const hasRestrictions = Object.values(restrictions).some(Boolean);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !hasRestrictions) return null;

  // Animation variants
  const backdropVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 }
  };

  const modalVariants = {
    visible: { opacity: 1, y: 0, scale: 1 },
    hidden: { opacity: 0, y: 20, scale: 0.95 }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      >
        <motion.div
          variants={modalVariants}
          transition={{ type: 'spring', damping: 25 }}
          className="relative w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">Coupon Restrictions</h3>
            <button
              onClick={handleClose}
              className="p-1 transition-colors rounded-full hover:bg-gray-200"
              aria-label="Close"
            >
              <X className="text-gray-500" size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Items Allowed */}
            {restrictions.items && (
              <div className="space-y-3">
                <h4 className="flex items-center text-sm font-medium text-gray-700">
                  <span className="w-2 h-2 mr-2 bg-blue-500 rounded-full"></span>
                  Applicable Items
                </h4>
                <div className="flex flex-wrap gap-2">
                  {coupon.itemsAllowed.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full"
                    >
                      {item.itemName || "Unnamed Item"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {restrictions.categories && (
              <div className="space-y-3">
                <h4 className="flex items-center text-sm font-medium text-gray-700">
                  <span className="w-2 h-2 mr-2 bg-purple-500 rounded-full"></span>
                  Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {coupon.categoryAllowed.map((category, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full"
                    >
                      {category.name || "Uncategorized"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sub Categories */}
            {restrictions.subCategories && (
              <div className="space-y-3">
                <h4 className="flex items-center text-sm font-medium text-gray-700">
                  <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
                  Sub Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {coupon.subCategoryAllowed.map((subCat, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full"
                    >
                      {subCat.name || "Unnamed Subcategory"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sub Sub Categories */}
            {restrictions.subSubCategories && (
              <div className="space-y-3">
                <h4 className="flex items-center text-sm font-medium text-gray-700">
                  <span className="w-2 h-2 mr-2 rounded-full bg-amber-500"></span>
                  Sub Sub Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {coupon.subsubCategoryAllowed.map((subSubCat, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs font-medium rounded-full text-amber-700 bg-amber-100"
                    >
                      {subSubCat.name || "Unnamed Sub-subcategory"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 p-4 border-t bg-gray-50">
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AllowedList;