const SettingsTabNav = ({ tabs, activeTab, onTabChange }) => {
  return (
    <nav className="md:w-56 shrink-0 flex md:flex-col gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary-muted text-primary"
                : "text-secondary hover:text-primary hover:bg-surface-elevated"
            }`}
          >
            <Icon className="w-5 h-5" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};

export default SettingsTabNav;
