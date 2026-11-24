// Repository addresses as people paste them, and the GitHub page that takes
// a deploy key. Used by the setup guide and the wizard.

// The push needs the SSH address (git@host:owner/repo.git). People paste what
// they have, most often the web address from the browser's address bar, so a
// web address is turned into the SSH one. Null when it is not a repository
// address at all.
export const normalizeRepoAddress = (input = "") => {
  const value = String(input).trim();
  if (/^git@[\w.-]+:[\w.-]+(\/[\w.-]+)+$/.test(value)) return value;
  if (/^ssh:\/\/[\w.-]+@[\w.-]+(:\d+)?(\/[\w.-]+){2,}$/.test(value)) {
    return value;
  }
  const web = value.match(
    /^(?:https?:\/\/)?((?:[\w-]+\.)+[a-z]{2,})\/([\w.-]+(?:\/[\w.-]+)+?)(?:\.git)?\/?$/i,
  );
  if (!web) return null;
  const [, host, path] = web;
  // On GitHub a repository is always owner/name; anything after it is a page
  // inside the repository (/tree/main, /settings). GitLab nests groups.
  const repoPath =
    host.toLowerCase() === "github.com"
      ? path
          .split("/")
          .slice(0, 2)
          .join("/")
          .replace(/\.git$/, "")
      : path;
  return repoPath.includes("/") ? `git@${host}:${repoPath}.git` : null;
};

// The page where a deploy key is added, for a github.com address in any form
// the wizard accepts (git@github.com:o/r.git, ssh://git@github.com/o/r,
// https://github.com/o/r). Null for other hosts: there is no address to build.
export const deployKeysLink = (repoUrl = "") => {
  const match = String(repoUrl)
    .trim()
    .match(
      /^(?:https:\/\/|ssh:\/\/)?(?:git@)?github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i,
    );
  if (!match) return null;
  const [, owner, repo] = match;
  return {
    href: `https://github.com/${owner}/${repo}/settings/keys/new`,
    label: `Open deploy keys for ${owner}/${repo}`,
  };
};
