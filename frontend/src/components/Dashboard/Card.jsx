const Card = ({
  title,
  value = '0',
  icon,
  className = ''
}) => {
  const Icon = icon;
  return (
    <div className={`flex items-center text-left  w-full   text-white shadow-md rounded-xl bg-white  ${className}`}>
      <div className="flex items-center justify-center w-24 h-24 text-white rounded-lg bg-gradient-to-br from-cyan-700 to-blue-600">
        <Icon size={64} />
      </div>
      <div className="ml-4">
        <h2 className="text-2xl font-bold text-gray-800">{value}</h2>
        <p className="text-lg font-semibold text-gray-700 uppercase">{title}</p>
      </div>
    </div>
  );
};
export default Card;