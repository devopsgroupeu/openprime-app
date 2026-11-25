// src/components/EnvironmentCard.jsx
import { useNavigate } from "react-router";
import { ArrowRight, Copy, Pencil, Trash2 } from "lucide-react";

import ProviderIcon from "./icons/ProviderIcon";
import ServiceIcon from "./icons/ServiceIcon";
import { getServiceConfig } from "../config/servicesConfig";
import {
  enabledServices,
  getEffectiveStatus,
  modifiedAt,
  prefixOf,
  regionOf,
} from "../utils/environmentStats";
import { CoverGradient } from "@/components/shared/cover-gradient";
import { formatDateTime, formatRelative } from "@/components/shared/format";
import { IconTile } from "@/components/shared/icon-tile";
import { ResourceActionsMenu } from "@/components/shared/resource-actions-menu";
import { ResourceCard } from "@/components/shared/resource-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAX_ICONS = 6;

const serviceName = (key) =>
  getServiceConfig(key)?.displayName ?? key.toUpperCase();

// Above the card's stretched link so each icon can show its name on hover;
// the gaps between icons stay part of the link.
function ServiceIcons({ services }) {
  const shown = services.slice(0, MAX_ICONS);
  const more = services.slice(MAX_ICONS).map(serviceName);
  return (
    <ul
      aria-label="Enabled services"
      className="pointer-events-none relative z-10 flex w-fit flex-wrap items-center gap-1.5"
    >
      {shown.map((key) => (
        <li key={key} className="pointer-events-auto flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex">
                <ServiceIcon
                  service={key}
                  className="size-5 text-muted-foreground"
                />
                <span className="sr-only">{serviceName(key)}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>{serviceName(key)}</TooltipContent>
          </Tooltip>
        </li>
      ))}
      {more.length > 0 ? (
        <li className="pointer-events-auto flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground tabular-nums">
                +{more.length}
                <span className="sr-only">{`: ${more.join(", ")}`}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>{more.join(", ")}</TooltipContent>
          </Tooltip>
        </li>
      ) : null}
    </ul>
  );
}

/**
 * The environment's generated band with its round provider avatar on a card
 * disc. The card and the detail header show the same one for the same id, so
 * they read as one object. Decorative: the band is aria-hidden.
 */
export function EnvironmentCover({ environment, className }) {
  return (
    <CoverGradient id={environment.id} className={className}>
      <IconTile
        size="xl"
        className="absolute bottom-3 left-3 rounded-full bg-card text-foreground shadow-(--shadow-ring-sm)"
      >
        <ProviderIcon provider={environment.provider} />
      </IconTile>
    </CoverGradient>
  );
}

const EnvironmentCard = ({ environment, onCopyId, onDelete }) => {
  const navigate = useNavigate();
  const href = `/environments/${environment.id}`;
  const services = enabledServices(environment);
  const region = regionOf(environment);
  const prefix = prefixOf(environment);
  const modified = modifiedAt(environment);

  const actions = [
    { label: "Open", icon: ArrowRight, onSelect: () => navigate(href) },
    { label: "Edit", icon: Pencil, onSelect: () => navigate(`${href}/edit`) },
    {
      label: "Copy environment ID",
      icon: Copy,
      onSelect: () => onCopyId(environment),
    },
    ...(onDelete
      ? [
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onSelect: () => onDelete(environment),
          },
        ]
      : []),
  ];

  return (
    <ResourceCard
      href={href}
      title={environment.name}
      cover={
        <EnvironmentCover
          environment={environment}
          className="h-24 shrink-0 sm:h-28"
        />
      }
      badges={<StatusBadge status={getEffectiveStatus(environment)} />}
      description={
        region || prefix ? (
          <>
            {region}
            {region && prefix ? (
              <span
                aria-hidden
                className="mx-2 inline-block h-3 w-px translate-y-0.5 bg-border"
              />
            ) : null}
            {prefix ? (
              <>
                Resource prefix <span className="font-mono">{prefix}</span>
              </>
            ) : null}
          </>
        ) : null
      }
      meta={
        modified ? (
          // Under the stretched link, so a click on it opens the
          // environment; screen readers also hear the exact time.
          <span className="whitespace-nowrap">
            Modified <time dateTime={modified}>{formatRelative(modified)}</time>
            <span className="sr-only">{`, ${formatDateTime(modified)}`}</span>
          </span>
        ) : null
      }
      actions={
        <ResourceActionsMenu
          label={`More actions for ${environment.name}`}
          actions={actions}
        />
      }
    >
      {services.length > 0 ? <ServiceIcons services={services} /> : null}
    </ResourceCard>
  );
};

export default EnvironmentCard;
