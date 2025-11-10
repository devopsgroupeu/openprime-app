import React from "react";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

const ServiceConfiguration = ({
  icon,
  title,
  enabled,
  expanded,
  onToggle,
  onExpand,
  onAskAI,
  service,
  children,
}) => (
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
      <div className="flex items-center space-x-1">
        {/* Ask AI Button */}
        <button
          type="button"
          onClick={() => onAskAI?.(service, title)}
          className="p-1 text-teal-400 hover:text-teal-300 transition-colors"
          title="Ask AI about this service"
        >
          <MessageCircle className="w-4 h-4" />
        </button>

        {/* Expand/Collapse Button */}
        {enabled && (
          <button type="button" onClick={onExpand} className="p-1">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
      </div>
    </div>
    {enabled && expanded && (
      <div className="px-3 pb-3 border-t border-gray-600">{children}</div>
    )}
  </div>
);

export default ServiceConfiguration;
