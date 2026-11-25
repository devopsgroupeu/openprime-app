import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

const ACCOUNT_ID_REGEX = /^\d{12}$/;

const CloudCredentialModal = ({
  credential,
  provider,
  onClose,
  onSave,
  isOpen,
}) => {
  const [formData, setFormData] = useState(() => ({
    name: credential?.name || "",
    identifier: credential?.identifier || "",
    accessKey: credential?.credentials?.accessKey || "",
    secretKey: credential?.credentials?.secretKey || "",
    isDefault: credential?.isDefault || false,
  }));
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const originalIdentifier = credential?.identifier;
  const identifierChanged =
    formData.identifier.trim() !== (originalIdentifier || "").trim();
  const shouldValidateIdentifierFormat = !credential || identifierChanged;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.identifier.trim()) {
      newErrors.identifier = "Account ID is required";
    } else if (
      shouldValidateIdentifierFormat &&
      !ACCOUNT_ID_REGEX.test(formData.identifier.trim())
    ) {
      newErrors.identifier = "Account ID must be exactly 12 digits";
    }

    if (!credential && !formData.accessKey.trim()) {
      newErrors.accessKey = "Access key ID is required";
    }

    if (!credential && !formData.secretKey.trim()) {
      newErrors.secretKey = "Secret access key is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const credentialData = {
      provider: provider,
      name: formData.name,
      identifier: formData.identifier,
      isDefault: formData.isDefault,
    };

    // Only send secrets when the user actually entered them. On edit, blank
    // fields mean "keep the stored credentials" (secrets are never sent to the
    // client), so we omit the credentials object entirely.
    if (formData.accessKey || formData.secretKey) {
      credentialData.credentials = {
        accessKey: formData.accessKey,
        secretKey: formData.secretKey,
      };
    }

    setSaving(true);
    try {
      await onSave(credentialData);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Label, control, help and error of one text field, linked for screen readers.
  const field = (key, label, input, help) => {
    const id = `credential-${key}`;
    const describedBy =
      [help && `${id}-help`, errors[key] && `${id}-error`]
        .filter(Boolean)
        .join(" ") || undefined;
    return (
      <Field data-invalid={errors[key] ? true : undefined}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {input({
          id,
          value: formData[key],
          onChange: (e) => handleChange(key, e.target.value),
          "aria-invalid": errors[key] ? true : undefined,
          "aria-describedby": describedBy,
        })}
        {help ? (
          <FieldDescription id={`${id}-help`}>{help}</FieldDescription>
        ) : null}
        {errors[key] ? (
          <FieldError id={`${id}-error`}>{errors[key]}</FieldError>
        ) : null}
      </Field>
    );
  };

  const keyPlaceholder = credential ? "Unchanged" : undefined;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {credential ? `Edit ${credential.name}` : "Add AWS credentials"}
          </DialogTitle>
          <DialogDescription>
            OpenPrime uses these keys to create the Terraform state bucket in
            your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <FieldGroup className="gap-4">
            {field("name", "Name", (props) => (
              <Input
                {...props}
                autoComplete="off"
                placeholder="e.g. Production account"
              />
            ))}
            {field(
              "identifier",
              "AWS account ID",
              (props) => (
                <Input
                  {...props}
                  inputMode="numeric"
                  autoComplete="off"
                  className="font-mono"
                  placeholder="123456789012"
                />
              ),
              "The 12-digit ID of your AWS account.",
            )}
            {field("accessKey", "Access key ID", (props) => (
              <Input
                {...props}
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
                placeholder={keyPlaceholder ?? "AKIAIOSFODNN7EXAMPLE"}
              />
            ))}
            {field(
              "secretKey",
              "Secret access key",
              (props) => (
                <InputGroup>
                  <InputGroupInput
                    {...props}
                    type={showSecretKey ? "text" : "password"}
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono"
                    placeholder={
                      keyPlaceholder ??
                      "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      aria-label={
                        showSecretKey
                          ? "Hide secret access key"
                          : "Show secret access key"
                      }
                      aria-pressed={showSecretKey}
                      onClick={() => setShowSecretKey((v) => !v)}
                    >
                      {showSecretKey ? (
                        <EyeOff aria-hidden />
                      ) : (
                        <Eye aria-hidden />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              ),
              credential
                ? "Leave both keys blank to keep the stored ones."
                : undefined,
            )}
            <Field orientation="horizontal">
              <Checkbox
                id="credential-default"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  handleChange("isDefault", checked === true)
                }
                aria-describedby="credential-default-help"
              />
              <FieldContent>
                <FieldLabel htmlFor="credential-default">
                  Mark as default
                </FieldLabel>
                <FieldDescription id="credential-default-help">
                  Shown as Default when you pick credentials for an environment.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner aria-hidden /> : null}
              {credential ? "Save changes" : "Add credentials"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CloudCredentialModal;
