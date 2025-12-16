import React from 'react';
import { Status } from '../types';

interface StatusMessageProps {
  status: Status;
  message: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status, message }) => {
  if (status === Status.IDLE) return <div className="text-xs text-slate-500 italic">Ready for command.</div>;

  let bgClass = '';
  let textClass = '';
  let borderClass = '';

  switch (status) {
    case Status.LOADING:
      bgClass = 'bg-blue-500/10';
      textClass = 'text-blue-200';
      borderClass = 'border-blue-500/30';
      break;
    case Status.SUCCESS:
      bgClass = 'bg-green-500/10';
      textClass = 'text-green-300';
      borderClass = 'border-green-500/30';
      break;
    case Status.ERROR:
      bgClass = 'bg-red-500/10';
      textClass = 'text-red-300';
      borderClass = 'border-red-500/30';
      break;
    default:
      bgClass = 'bg-slate-700/30';
      textClass = 'text-slate-300';
  }

  return (
    <div className={`p-3 rounded-lg border ${bgClass} ${borderClass} flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-2`}>
        {status === Status.LOADING && (
             <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5"></div>
        )}
        <div className={`text-xs font-medium leading-relaxed ${textClass}`}>
            {message}
        </div>
    </div>
  );
};

export default StatusMessage;