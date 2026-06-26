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
  <div className="bg-background-secondary rounded-lg overflow-hidden">
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center">
        <input
          type="checkbox"
          className="mr-3 w-4 h-4"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        {icon}
        <span className="text-primary font-medium text-sm">{title}</span>
      </div>
      <div className="flex items-center space-x-1">
        {/* Ask AI Button */}
        <button
          type="button"
          onClick={() => onAskAI?.(service, title)}
          className="p-1 text-accent hover:bg-primary-muted transition-colors"
          title="Ask AI about this service"
        >
          <MessageCircle className="w-4 h-4" />
        </button>

        {/* Expand/Collapse Button */}
        {enabled && (
          <button type="button" onClick={onExpand} className="p-1">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-tertiary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-tertiary" />
            )}
          </button>
        )}
      </div>
    </div>
    {enabled && expanded && (
      <div className="px-3 pb-3 border-t border-border">{children}</div>
    )}
  </div>
);

export default ServiceConfiguration;
