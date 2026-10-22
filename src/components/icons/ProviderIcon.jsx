// src/components/icons/ProviderIcon.jsx
// Renders cloud provider brand marks, with lucide fallbacks for other providers.
import { Cloud, Server } from "lucide-react";
import AwsIcon from "./AwsIcon";
import AzureIcon from "./AzureIcon";
import GcpIcon from "./GcpIcon";

// Existing consumers use this flag to apply AWS orange styling.
export const isBrandedProvider = (provider) => provider === "aws";

const ProviderIcon = ({ provider, className }) => {
  if (provider === "aws") return <AwsIcon className={className} />;
  if (provider === "azure") return <AzureIcon className={className} />;
  if (provider === "gcp") return <GcpIcon className={className} />;
  if (provider === "onpremise") return <Server className={className} />;

  return <Cloud className={className} />;
};

export default ProviderIcon;
