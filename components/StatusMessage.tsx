
import React from 'react';
import { Status } from '../types';

interface StatusMessageProps {
  status: Status;
  message: string;
}

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
);

const SuccessIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StatusMessage: React.FC<StatusMessageProps> = ({ status, message }) => {
  if (status === Status.IDLE) {
    return null;
  }

  let icon;
  let textContent;
  let textColor = 'text-gray-300';

  switch (status) {
    case Status.LOADING:
      icon = <LoadingSpinner />;
      textContent = 'Sending...';
      textColor = 'text-blue-300';
      break;
    case Status.SUCCESS:
      icon = <SuccessIcon />;
      textContent = message;
      textColor = 'text-green-300';
      break;
    case Status.ERROR:
      icon = <ErrorIcon />;
      textContent = message;
      textColor = 'text-red-300';
      break;
    default:
      return null;
  }

  return (
    <div className={`mt-4 p-3 rounded-lg flex items-center space-x-3 bg-gray-800 border border-gray-700 transition-all duration-300`}>
      {icon}
      <p className={`text-sm ${textColor}`}>{textContent}</p>
    </div>
  );
};

export default StatusMessage;
