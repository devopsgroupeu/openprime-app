# Chart and git provider logos

Official logos of the Helm charts OpenPrime installs and of the git providers it pushes to. They
are trademarks of their owners and are not covered by this repository's licence. They are used
only to identify the corresponding chart or provider, always next to its name or its repository
URL, and are unmodified except for size (no recolour, no crop). `LogoTile`
(`src/components/shared/logo-tile.jsx`) is the only place that renders them; the key of each file
is in `src/config/logos.js`.

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
- `nginx.png` (Ingress NGINX Controller): `charts/nginx-ingress/chart-icon.png` (225 x 256 px) in
  https://github.com/nginx/kubernetes-ingress, NGINX's own repository. The Kubernetes
  ingress-nginx project has no logo of its own and its Helm chart uses the NGINX logo as its icon.
  Terms: https://www.f5.com/company/policies/trademarks
- `cert-manager.svg`: `projects/cert-manager/icon/color/cert-manager-icon-color.svg` in
  https://github.com/cncf/artwork. Terms: CNCF artwork guidelines in that repository and
  https://www.linuxfoundation.org/legal/trademark-usage
- `karpenter.svg`: `website/static/favicon.svg` in https://github.com/aws/karpenter-provider-aws
  (the mark the Karpenter site uses). Terms: Apache-2.0 repository; the name and mark belong to
  their owners.
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

## No logo

None: every chart and both git providers have an official file. A chart added later without one
declares `null` in `CHART_LOGOS` and shows its lucide stand-in (`Package`) on the muted tile; a
repository on another host shows `GitBranch`.
