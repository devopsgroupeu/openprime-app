# Chart, git and cloud provider logos

Official logos of the Helm charts OpenPrime installs and of the git providers it pushes to. They
are trademarks of their owners and are not covered by this repository's licence. They are used
only to identify the corresponding chart or provider, always next to its name or its repository
URL, and are unmodified except for size (no recolour, no crop) and the one change noted at
`karpenter.svg`. `LogoTile` (`src/components/shared/logo-tile.jsx`) is the only place that renders
them; the key of each file is in `src/config/logos.js`.

All files were retrieved on 2026-11-25. Every SVG was checked for scripts, `foreignObject`, event
handlers, external references and embedded images (none found); they render through `<img>`,
which never runs SVG script.

## Charts

- `prometheus.svg` (kube-prometheus-stack): `projects/prometheus/icon/color/prometheus-icon-color.svg`
  in https://github.com/cncf/artwork. Terms: CNCF artwork guidelines in that repository and
  https://www.linuxfoundation.org/legal/trademark-usage
- `loki.svg` (Loki and Promtail): `public/app/features/loki-helpers/loki_icon.svg` in
  https://github.com/grafana/grafana. Promtail has no logo of its own; its Helm chart uses the
  Loki logo as its icon, so Promtail shows this file too. Terms: https://grafana.com/trademark-policy/
- `tempo.svg` (Tempo Distributed): `src/img/tempo_logo.svg` in
  https://github.com/grafana/grafana-tempo-datasource. Terms: https://grafana.com/trademark-policy/
- `ingress-nginx.png` (Ingress NGINX Controller): the icon the chart itself declares, the
  `icon:` field of `charts/ingress-nginx/Chart.yaml` in https://github.com/kubernetes/ingress-nginx
  (main), downloaded unchanged from that URL:
  https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Nginx_logo.svg/500px-Nginx_logo.svg.png
  (500 x 106 px, the NGINX logo). The project has no logo of its own; like Promtail with Loki, it
  shows the logo its chart names. Terms: https://www.f5.com/company/policies/trademarks
- `cert-manager.svg`: `projects/cert-manager/icon/color/cert-manager-icon-color.svg` in
  https://github.com/cncf/artwork. Terms: CNCF artwork guidelines in that repository and
  https://www.linuxfoundation.org/legal/trademark-usage
- `karpenter.svg`: `website/static/favicon.svg` in https://github.com/aws/karpenter-provider-aws
  (the mark the Karpenter site uses). Modified: its `@media (prefers-color-scheme: dark)` rule,
  which switched the fill to a lighter purple, is removed, so the mark keeps its brand colour on
  the white tile in both themes. Terms: Apache-2.0 repository; the name and mark belong to their
  owners.
- `aws-load-balancer-controller.svg`: `docs/assets/images/aws_load_balancer_icon.svg` in
  https://github.com/kubernetes-sigs/aws-load-balancer-controller, the project's own icon (an AWS
  Architecture Icon). Terms: https://aws.amazon.com/architecture/icons/ and
  https://aws.amazon.com/trademark-guidelines/
- `argo.svg` (Argo CD): `projects/argo/icon/color/argo-icon-color.svg` in
  https://github.com/cncf/artwork. Terms: CNCF artwork guidelines in that repository and
  https://www.linuxfoundation.org/legal/trademark-usage
- `external-dns.png` (External DNS): `docs/img/external-dns.png` in
  https://github.com/kubernetes-sigs/external-dns (1586 x 1587 px, resized to 128 px). Terms:
  https://www.linuxfoundation.org/legal/trademark-usage

## Git providers

- `github.svg`: `GitHub Logos/SVG/GitHub_Invertocat_Black.svg` in
  https://brand.github.com/GitHub_Logos.zip (the same file as openprime-ai's
  `public/assets/integration-logos/github.svg`). Terms: https://brand.github.com/foundations/logo
- `gitlab.svg`: `illustrations/gitlab_logo.svg` in https://gitlab.com/gitlab-org/gitlab-svgs,
  GitLab's own SVG library. Terms: https://design.gitlab.com/brand-logo/core-logo and
  https://handbook.gitlab.com/handbook/marketing/brand-and-product-marketing/brand/brand-activation/trademark-guidelines/

## Cloud providers

`ProviderIcon` draws these inline (no file here), retrieved on 2026-11-27, paths and colors
unchanged:

- AWS (`AwsIcon.jsx`): https://commons.wikimedia.org/wiki/File:Amazon_Web_Services_Logo.svg. Its
  squid-ink wordmark is white on dark surfaces, as in AWS's reverse logo. Terms:
  https://aws.amazon.com/trademark-guidelines/
- Azure (`AzureIcon.jsx`): https://commons.wikimedia.org/wiki/File:Microsoft_Azure.svg. Terms:
  https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks
- Google Cloud (`GcpIcon.jsx`): the four colored paths of
  https://commons.wikimedia.org/wiki/File:Google_Cloud_logo.svg, without its wordmark. Terms:
  https://about.google/brand-resource-center/trademark-list/

## No logo

None today: every chart and both git providers have a file (Promtail and ingress-nginx through
the logo their charts declare, see above). A chart added later without one declares `null` in
`CHART_LOGOS` and shows its lucide stand-in (`Package`) on the muted tile; a repository on another
host shows `GitBranch`.
