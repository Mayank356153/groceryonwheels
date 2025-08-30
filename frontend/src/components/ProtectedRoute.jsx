import { Navigate } from "react-router-dom";

const getFlatPermissions = (permissions) => {
  let flat = [];
  permissions.forEach((perm) => {
    const moduleName = perm.module.toLowerCase();
    perm.actions.forEach((action) => {
      // Only process if the action is "view" (case-insensitive)
      if (action.toLowerCase() === "view") {
        if (moduleName === "report") {
          flat.push("view_reports");
        } else if (moduleName === "salespayment") {
          flat.push("view_sales_payment_report");
        } else if (moduleName === "customerorders") {
          flat.push("view_customer_orders");
        }
        // Add other mappings as needed
      }
    });
  });
  return flat;
};

const ProtectedRoute = ({ element, requiredPermission }) => {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "guest").toLowerCase();

  // Retrieve and flatten permissions from localStorage
  const storedPermissions = localStorage.getItem("permissions");
  const permissions = storedPermissions ? JSON.parse(storedPermissions) : [];
  const flatPermissions = getFlatPermissions(permissions);

  if (!token) {
    console.warn("No token found. Redirecting to login.");
    return <Navigate to="/" />;
  }

  // Admin bypass: if role is "admin", grant access regardless.
  if (role === "admin") {
    console.log("Admin access granted");
    return element;
  }

  // Normalize permissions array and requiredPermission for case-insensitive check.
  const normalizedPermissions = permissions.map(p => p.toLowerCase());
  const normalizedRequired = requiredPermission.toLowerCase();

  if (requiredPermission && !normalizedPermissions.includes(normalizedRequired)) {
    console.warn(`Access denied: Missing permission ${requiredPermission}`);
    return <Navigate to="/dashboard" />;
  }

  console.log("Access granted");
  return element;
};

export default ProtectedRoute;
