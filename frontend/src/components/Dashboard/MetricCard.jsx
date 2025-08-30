import { FaCube } from 'react-icons/fa';
import { FaRegCalendarAlt } from 'react-icons/fa';
const MetricCard = ({
    title,
    value=0,
    icon,
    className="",
    props,
}) => {
    const Icon=icon
  return (
    <div className={className}>
      <div>
        <h2 className="text-3xl font-bold">{value}</h2>
        <p className="mt-1 text-sm uppercase">{title}</p>
      </div>
      <div className="transition-transform duration-300 ease-in-out hover:scale-125">
        <Icon size={48} className="opacity-60" />
      </div>
    </div>
  );
};

export default MetricCard;
