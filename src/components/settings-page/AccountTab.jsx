import {
  SettingsRow,
  SettingsRowGroup,
  SettingsSection,
} from "@/components/shared/settings";
import { Input } from "@/components/ui/input";

const FIELDS = [
  {
    key: "firstName",
    id: "settings-first-name",
    label: "First name",
    autoComplete: "given-name",
  },
  {
    key: "lastName",
    id: "settings-last-name",
    label: "Last name",
    autoComplete: "family-name",
  },
  {
    key: "email",
    id: "settings-email",
    label: "Email",
    type: "email",
    autoComplete: "email",
  },
];

const AccountTab = ({ profile, onProfileChange }) => (
  <SettingsSection title="Profile">
    <SettingsRowGroup>
      {FIELDS.map((field) => (
        <SettingsRow
          key={field.key}
          title={field.label}
          controlId={field.id}
          control={
            <Input
              id={field.id}
              type={field.type ?? "text"}
              autoComplete={field.autoComplete}
              value={profile[field.key]}
              onChange={(e) => onProfileChange(field.key, e.target.value)}
              className="sm:w-64"
            />
          }
        />
      ))}
    </SettingsRowGroup>
  </SettingsSection>
);

export default AccountTab;
