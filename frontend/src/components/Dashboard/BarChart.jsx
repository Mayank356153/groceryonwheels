
// // import {
// //   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
// // } from 'recharts';
// // import axios from 'axios';
// // import { useState, useLayoutEffect } from 'react';
// // import dayjs from 'dayjs'; // install if needed: npm install dayjs
// // import LoadingScreen from '../../Loading';
// // const BarChartComponent = ({active}) => {
// //   const [chartData, setChartData] = useState([]);
// // const[loading,setLoading]=useState(false)
// //   const fetchChart = async () => {
// //     try {
// //       setLoading(true)
// //       const response = await axios.get(
// //         `api/dashboard-chart-data?interval=${active}`,
// //         {
// //           headers: {
// //             Authorization: `Bearer ${localStorage.getItem("token")}`,
// //           },
// //         }
// //       );
// // // console.log(response.data)
// //       const { purchases, sales, expenses } = response.data.data;

// //       // Helper to group by month
// //       const monthlyTotals = {};

// //       const addToMonth = (list, key) => {
// //         list.forEach(({ _id, total }) => {
// //           let label = "";

// //           if (active === "daily") {
// //             label = dayjs(_id).format("DD MMM,YYYY");
// //           } else if (active === "weekly") {
// //             const startOfWeek = dayjs(_id).startOf("week").format("DD MMM");
// //             const endOfWeek = dayjs(_id).endOf("week").format("DD MMM,YYYY");
// //             label = `${startOfWeek} - ${endOfWeek}`;
// //           } else if (active === "monthly") {
// //             label = dayjs(_id).format("MMM,YYYY");
// //           } else if (active === "yearly") {
// //             label = dayjs(_id).format("YYYY");
// //           }
          
// //           if (!monthlyTotals[label]) {
// //             monthlyTotals[label] = { month:label, Purchase: 0, Sales: 0, Expense: 0 };
// //           }
// //           monthlyTotals[label][key] += total;
// //         });
// //       };

// //       addToMonth(purchases, "Purchase");
// //       addToMonth(sales, "Sales");
// //       addToMonth(expenses, "Expense");

// //       // Convert object back to sorted array
// //       const finalData = Object.values(monthlyTotals).sort((a, b) =>
// //         dayjs(a.month, "MMM,YYYY").isAfter(dayjs(b.month, "MMM,YYYY")) ? 1 : -1
// //       );

// //       setChartData(finalData);
// //     } catch (err) {
// //       console.log(err.message);
// //     }
// //     finally{
// //       setLoading(false)
// //     }
// //   };

// //   useLayoutEffect(() => {
// //     fetchChart();
// //   }, [active]);
// // if(loading) <LoadingScreen />
// //   return (
// //     <div className="w-full p-4 bg-white border-t-4 border-blue-700 rounded-md shadow-md">
// //       <h3 className="mb-2 text-lg font-semibold text-gray-700">
// //         Purchase, Sales & Expense Bar Chart
// //       </h3>
// //       <ResponsiveContainer width="100%" height={500}>
// //         <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
// //           <CartesianGrid strokeDasharray="3 3" />
// //           <XAxis dataKey="month" />
// //           <YAxis />
// //           <Tooltip />
// //           <Legend />
// //           <Bar dataKey="Purchase" fill="orangered" />
// //           <Bar dataKey="Sales" fill="blue" />
// //           <Bar dataKey="Expense" fill="green" />
// //         </BarChart>
// //       </ResponsiveContainer>
// //     </div>
// //   );
// // };

// // export default BarChartComponent;
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
// } from 'recharts';
// import axios from 'axios';
// import { useState, useLayoutEffect } from 'react';
// import dayjs from 'dayjs';
// import Skeleton from 'react-loading-skeleton'; // Import Skeleton
// import 'react-loading-skeleton/dist/skeleton.css'; // Import styles for skeleton

// const BarChartComponent = ({ active }) => {
//   const [chartData, setChartData] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const fetchChart = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(
//         `api/dashboard-chart-data?interval=${active}`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );

//       const { purchases, sales, expenses } = response.data.data;

//       const monthlyTotals = {};

//       const addToMonth = (list, key) => {
//         list.forEach(({ _id, total }) => {
//           let label = "";

//           if (active === "daily") {
//             label = dayjs(_id).format("DD MMM,YYYY");
//           } else if (active === "weekly") {
//             const startOfWeek = dayjs(_id).startOf("week").format("DD MMM");
//             const endOfWeek = dayjs(_id).endOf("week").format("DD MMM,YYYY");
//             label = `${startOfWeek} - ${endOfWeek}`;
//           } else if (active === "monthly") {
//             label = dayjs(_id).format("MMM,YYYY");
//           } else if (active === "yearly") {
//             label = dayjs(_id).format("YYYY");
//           }

//           if (!monthlyTotals[label]) {
//             monthlyTotals[label] = { month: label, Purchase: 0, Sales: 0, Expense: 0 };
//           }
//           monthlyTotals[label][key] += total;
//         });
//       };

//       addToMonth(purchases, "Purchase");
//       addToMonth(sales, "Sales");
//       addToMonth(expenses, "Expense");

//       const finalData = Object.values(monthlyTotals).sort((a, b) =>
//         dayjs(a.month, "MMM,YYYY").isAfter(dayjs(b.month, "MMM,YYYY")) ? 1 : -1
//       );

//       setChartData(finalData);
//     } catch (err) {
//       console.log(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useLayoutEffect(() => {
//     fetchChart();
//   }, [active]);

//   if (loading) {
//     return (
//       <div className="relative h-[500px] w-full flex items-center justify-center">
//           <Skeleton height={500} width="100%" />
//           <div className="absolute">
//             <svg className="w-8 h-8 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l4-4-4-4v4a12 12 0 00-12 12h4z" />
//             </svg>
//           </div>
//         </div>
//     );
//   }

//   return (
//     <div className="w-full p-4 bg-white border-t-4 border-blue-700 rounded-md shadow-md">
//       <h3 className="mb-2 text-lg font-semibold text-gray-700">
//         Purchase, Sales & Expense Bar Chart
//       </h3>
//       <ResponsiveContainer width="100%" height={500}>
//         <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="month" />
//           <YAxis />
//           <Tooltip />
//           <Legend />
//           <Bar dataKey="Purchase" fill="orangered" />
//           <Bar dataKey="Sales" fill="blue" />
//           <Bar dataKey="Expense" fill="green" />
//         </BarChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default BarChartComponent;
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

const BarChartComponent = ({ active }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChart = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `api/dashboard-chart-data?interval=${active}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const { purchases, sales, expenses } = response.data.data;
      const monthlyTotals = {};

      const addToMonth = (list, key) => {
        list.forEach(({ _id, total }) => {
          let label = "";

          if (active === "daily") {
            label = dayjs(_id).format("DD MMM,YYYY");
          } else if (active === "weekly") {
            const startOfWeek = dayjs(_id).startOf("week").format("DD MMM");
            const endOfWeek = dayjs(_id).endOf("week").format("DD MMM,YYYY");
            label = `${startOfWeek} - ${endOfWeek}`;
          } else if (active === "monthly") {
            label = dayjs(_id).format("MMM,YYYY");
          } else if (active === "yearly") {
            label = dayjs(_id).format("YYYY");
          }

          if (!monthlyTotals[label]) {
            monthlyTotals[label] = { month: label, Purchase: 0, Sales: 0, Expense: 0 };
          }
          monthlyTotals[label][key] += total;
        });
      };

      addToMonth(purchases, "Purchase");
      addToMonth(sales, "Sales");
      addToMonth(expenses, "Expense");

      const finalData = Object.values(monthlyTotals).sort((a, b) =>
        dayjs(a.month, "MMM,YYYY").isAfter(dayjs(b.month, "MMM,YYYY")) ? 1 : -1
      );

      setChartData(finalData);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChart();
  }, [active]);

  return (
    <div className="w-full p-4 transition-all duration-300 bg-white border-t-4 border-blue-700 rounded-md shadow-md">
      <h3 className="mb-4 text-lg font-semibold text-gray-700">
        Purchase, Sales & Expense Bar Chart
      </h3>

      <div className="relative w-full h-[500px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded animate-pulse">
            <div className="w-10 h-10 mb-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            <p className="font-medium text-gray-600">Fetching chart data...</p>
          </div>
        ) : (
          <div className="w-full h-full fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Purchase" fill="orangered" />
                <Bar dataKey="Sales" fill="blue" />
                <Bar dataKey="Expense" fill="green" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarChartComponent;
