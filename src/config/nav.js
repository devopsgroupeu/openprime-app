// Settings sections: the settings page, the settings sidebar and the command
// palette read them from here.
import { KeyRound, SlidersHorizontal, User } from "lucide-react";
import { matchPath } from "react-router";

/**
 * The environment wizard at `pathname` (the routes in App.jsx): `{ mode:
 * "create" }`, `{ mode: "edit", id }` or null. The shell, its breadcrumbs and
 * the sidebar read it from here.
 */
export function wizardRoute(pathname) {
  if (pathname === "/environments/create") return { mode: "create" };
  const edit = matchPath("/environments/:id/edit", pathname);
  return edit ? { mode: "edit", id: edit.params.id } : null;
}

export const SETTINGS_TABS = [
  {
    id: "account",
    label: "Account",
    icon: User,
    description: "Your name and email as shown in OpenPrime.",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: SlidersHorizontal,
    description: "Your default cloud provider and region.",
  },
  {
    id: "cloud-credentials",
    label: "Cloud credentials",
    icon: KeyRound,
    description:
      "Access keys OpenPrime uses to create the Terraform state bucket in your AWS account.",
  },
];
