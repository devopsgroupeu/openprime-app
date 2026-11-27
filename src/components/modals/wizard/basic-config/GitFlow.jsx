import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import symbol from "@/assets/openprime-symbol-color.svg";
import { LogoTile } from "@/components/shared/logo-tile";
import { chartLogo, gitLogo, gitProviderOf } from "../../../../config/logos";

const REPOS = { github: "GitHub", gitlab: "GitLab" };

// A line with its verb in the middle and an arrowhead at the end.
function Connector({ label }) {
  return (
    <span className="flex min-w-12 items-center text-muted-foreground">
      <span className="h-px flex-1 bg-muted-foreground/40" />
      <span className="px-1.5 text-xs">{label}</span>
      <span className="h-px flex-1 bg-muted-foreground/40" />
      <ChevronRight className="-ml-2 size-4 text-muted-foreground/70" />
    </span>
  );
}

/**
 * The path of the generated code, in the Git repository section: OpenPrime
 * pushes to the repository, and Argo CD (installed with EKS, so only then)
 * pulls from it. One picture with a text alternative; the tiles are the
 * official logos (LogoTile).
 */
export default function GitFlow({ url, argoCd }) {
  const provider = gitProviderOf(url);
  const repo = REPOS[provider];
  const nodes = [
    { name: "OpenPrime", tile: { logo: symbol } },
    { name: repo ?? "Repository", tile: gitLogo(url), verb: "push" },
    ...(argoCd
      ? [{ name: "Argo CD", tile: chartLogo("argocd"), verb: "pull" }]
      : []),
  ];
  const label =
    `OpenPrime pushes the generated code to ${repo ?? "your repository"}` +
    (argoCd ? ", and Argo CD on EKS pulls it from there." : ".");

  return (
    <div
      role="img"
      aria-label={label}
      className="flex justify-center rounded-lg border bg-muted/60 px-4 py-4"
    >
      <div
        className="grid items-center gap-x-1 gap-y-1.5"
        style={{
          gridTemplateColumns: nodes
            .map((_, i) => (i ? "minmax(3rem, 7rem) auto" : "auto"))
            .join(" "),
        }}
      >
        {nodes.map((node, i) => (
          <Fragment key={node.name}>
            {i ? <Connector label={node.verb} /> : null}
            <span className="flex justify-center">
              <LogoTile {...node.tile} size="md" />
            </span>
          </Fragment>
        ))}
        {nodes.map((node, i) => (
          <Fragment key={node.name}>
            {i ? <span /> : null}
            <span
              data-node
              // One width for every node, so the lines start equally far from
              // each tile; narrow screens size them to their names.
              className="text-center text-xs font-medium sm:w-20"
            >
              {node.name}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
