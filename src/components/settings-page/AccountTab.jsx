import {
  SettingsRow,
  SettingsRowGroup,
  SettingsSection,
} from "@/components/shared/settings";
import { Input } from "@/components/ui/input";
import {
  FieldControl,
  invalidProps,
} from "../modals/wizard/basic-config/FieldControl";

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

// `errors`: the message per field key, shown under its input.
const AccountTab = ({ profile, errors, onProfileChange }) => (
  <SettingsSection title="Profile">
    <SettingsRowGroup>
      {FIELDS.map((field) => (
        <SettingsRow
          key={field.key}
          title={field.label}
          controlId={field.id}
          control={
            <FieldControl
              id={field.id}
              error={errors[field.key]}
              className="sm:w-64"
            >
              <Input
                id={field.id}
                type={field.type ?? "text"}
                autoComplete={field.autoComplete}
                value={profile[field.key]}
                {...invalidProps(field.id, errors[field.key])}
                onChange={(e) => onProfileChange(field.key, e.target.value)}
              />
            </FieldControl>
          }
        />
      ))}
    </SettingsRowGroup>
  </SettingsSection>
);

export default AccountTab;
