import { Link } from "react-router";

import { Callout } from "@/components/shared/callout";

// What to have at hand before the first environment (first-run list only).
// Credentials are optional, so this never blocks the New environment action.
const PrerequisitesChecklist = ({ hasCredentials = false }) => (
  <Callout variant="neutral" title="Before you create your first environment">
    <ul className="mt-1 list-disc pl-4 marker:text-muted-foreground">
      <li>
        {hasCredentials ? (
          "AWS credentials are added."
        ) : (
          <>
            <Link
              to="/settings/cloud-credentials"
              className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Add AWS credentials
            </Link>{" "}
            in Settings.
          </>
        )}
      </li>
      <li>Have a Git repository URL ready for your infrastructure code.</li>
      <li>Have an S3 bucket name ready for Terraform state.</li>
    </ul>
  </Callout>
);

export default PrerequisitesChecklist;
