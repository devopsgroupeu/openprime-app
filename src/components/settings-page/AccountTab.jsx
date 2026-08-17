const AccountTab = ({ profile, onProfileChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="settings-first-name"
          className="block text-sm font-semibold text-label mb-2"
        >
          First Name
        </label>
        <input
          id="settings-first-name"
          type="text"
          value={profile.firstName}
          onChange={(e) => onProfileChange("firstName", e.target.value)}
          className="w-full px-4 py-2.5 transition-colors"
          placeholder="Enter your first name"
        />
      </div>
      <div>
        <label
          htmlFor="settings-last-name"
          className="block text-sm font-semibold text-label mb-2"
        >
          Last Name
        </label>
        <input
          id="settings-last-name"
          type="text"
          value={profile.lastName}
          onChange={(e) => onProfileChange("lastName", e.target.value)}
          className="w-full px-4 py-2.5 transition-colors"
          placeholder="Enter your last name"
        />
      </div>
      <div>
        <label
          htmlFor="settings-email"
          className="block text-sm font-semibold text-label mb-2"
        >
          Email
        </label>
        <input
          id="settings-email"
          type="email"
          value={profile.email}
          onChange={(e) => onProfileChange("email", e.target.value)}
          className="w-full px-4 py-2.5 transition-colors"
          placeholder="Enter your email"
        />
      </div>
    </div>
  );
};

export default AccountTab;
