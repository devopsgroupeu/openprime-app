import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ServiceConfiguration = ({ icon, title, enabled, expanded, onToggle, onExpand, children }) => (
  <div className="bg-gray-700 rounded-lg overflow-hidden">
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center">
        <input
          type="checkbox"
          className="mr-3 w-4 h-4"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        {icon}
        <span className="text-white font-medium text-sm">{title}</span>
      </div>
      {enabled && (
        <button type="button" onClick={onExpand} className="p-1">
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
      )}
    </div>
    {enabled && expanded && (
      <div className="px-3 pb-3 border-t border-gray-600">
        {children}
      </div>
    )}
  </div>
);

export default ServiceConfiguration;
