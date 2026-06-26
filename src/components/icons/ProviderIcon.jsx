// src/components/icons/ProviderIcon.jsx
// Renders a recognizable icon per cloud provider. AWS uses its real brand mark
// (in AWS orange); others fall back to neutral lucide icons.
import { Cloud, Server } from "lucide-react";
import AwsIcon from "./AwsIcon";

export const isBrandedProvider = (provider) => provider === "aws";

const ProviderIcon = ({ provider, className }) => {
  if (provider === "aws") return <AwsIcon className={className} />;
  if (provider === "onpremise") return <Server className={className} />;
  return <Cloud className={className} />;
};

export default ProviderIcon;
