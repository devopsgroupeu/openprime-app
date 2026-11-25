// The problems of the Basics step, in page order. One list: they show under
// their fields, gate Continue on Basics and Create, mark the step in the
// stepper and are listed on Review. A switched-on state backend or git
// repository states intent, so its empty required field is one of them.
export const basicFieldErrors = (env, validationErrors) =>
  [
    !env.name?.trim() && {
      field: "name",
      message: "Enter a name for this environment.",
    },
    !env.globalPrefix?.trim() && {
      field: "globalPrefix",
      message: "Enter a resource prefix.",
    },
    !env.provider && { field: "provider", message: "Choose a cloud provider." },
    !env.region && { field: "region", message: "Choose a region." },
    validationErrors.find((e) => e.field === "domain" && !e.service),
    env.provider === "aws" &&
      env.terraformBackend?.enabled &&
      !env.terraformBackend.bucketName?.trim() && {
        field: "bucketName",
        message: "Add a state bucket or switch this off.",
      },
    env.gitRepository?.enabled &&
      !env.gitRepository.url?.trim() && {
        field: "gitUrl",
        message: "Enter the repository URL or switch this off.",
      },
  ].filter(Boolean);
