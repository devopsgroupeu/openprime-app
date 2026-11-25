// Settings sections: the settings page, the settings sidebar and the command
// palette read them from here.
import { KeyRound, SlidersHorizontal, User } from "lucide-react";

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
