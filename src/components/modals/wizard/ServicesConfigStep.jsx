// src/components/modals/wizard/ServicesConfigStep.js
// Wizard step 2: search and category filter, the enabled count with the bulk
// actions, and the services grouped by catalog category.
import { useState } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { getProviderServices } from "../../../config/providersConfig";
import DynamicServicesGrid, {
  groupByCategory,
} from "../../DynamicServicesGrid";
import { getServiceConfig } from "../../../config/servicesConfig";
import { FilterTabs, SearchField } from "@/components/shared/list-toolbar";
import { ResourceActionsMenu } from "@/components/shared/resource-actions-menu";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

// Starting points offered while nothing is enabled yet.
const PRESETS = {
  aws: [
    { label: "VPC and EKS", services: ["vpc", "eks"] },
    { label: "Basic stack", services: ["vpc", "rds", "s3"] },
  ],
  azure: [{ label: "VNet and AKS", services: ["vnet", "aks"] }],
  gcp: [{ label: "GKE", services: ["gke"] }],
};

const matches = (serviceName, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const definition = getServiceConfig(serviceName);
  return [serviceName, definition?.displayName, definition?.description]
    .filter(Boolean)
    .some((text) => text.toLowerCase().includes(q));
};

const ServicesConfigStep = ({
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onAskAI,
}) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  // The services this step renders: the provider's, present in the environment.
  const serviceNames = getProviderServices(newEnv.provider).filter(
    (name) => newEnv.services?.[name] && getServiceConfig(name),
  );
  const enabledCount = serviceNames.filter(
    (name) => newEnv.services[name].enabled,
  ).length;
  const categories = groupByCategory(serviceNames).map(([c]) => c);
  const visible = serviceNames.filter(
    (name) =>
      (category === "all" || getServiceConfig(name).category === category) &&
      matches(name, query),
  );

  // Switches services on or off and keeps their settings. Enabling is limited
  // to the services this step shows; disabling covers every service.
  const setEnabled = (names, enabled) =>
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        ...Object.fromEntries(
          names.map((name) => [name, { ...newEnv.services[name], enabled }]),
        ),
      },
    });
  const setAllServices = (enabled) =>
    setEnabled(
      enabled ? serviceNames : Object.keys(newEnv.services || {}),
      enabled,
    );
  const applyPreset = (services) =>
    setEnabled(
      services.filter((name) => serviceNames.includes(name)),
      true,
    );

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
  };

  const filtering = query.trim() !== "" || category !== "all";
  const presets =
    enabledCount === 0 && !filtering ? (PRESETS[newEnv.provider] ?? []) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchField
            value={query}
            onChange={setQuery}
            label="Search services"
          />
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <p
              aria-live="polite"
              className="text-sm text-muted-foreground tabular-nums"
            >
              {enabledCount} of {serviceNames.length} enabled
            </p>
            <ResourceActionsMenu
              label="Service actions"
              actions={[
                {
                  label: "Enable all",
                  icon: ToggleRight,
                  onSelect: () => setAllServices(true),
                  disabled: enabledCount === serviceNames.length,
                },
                {
                  label: "Disable all",
                  icon: ToggleLeft,
                  onSelect: () => setAllServices(false),
                  disabled: enabledCount === 0,
                },
              ]}
            />
          </div>
        </div>
        {categories.length > 1 ? (
          <FilterTabs
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "All" },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />
        ) : null}
      </div>

      {presets.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">Start with</p>
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="secondary"
              size="sm"
              onClick={() => applyPreset(preset.services)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <DynamicServicesGrid
          serviceNames={visible}
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          expandedServices={expandedServices}
          setExpandedServices={setExpandedServices}
          onAskAI={onAskAI}
        />
      ) : (
        <EmptyState
          variant="filtered"
          onClearFilters={clearFilters}
          clearLabel={category === "all" ? "Clear search" : "Clear filters"}
        />
      )}
    </div>
  );
};

export default ServicesConfigStep;
