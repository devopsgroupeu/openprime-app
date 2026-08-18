# Changelog

All notable changes to this project will be documented in this file.

## [1.17.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.16.3...v1.17.0) (2026-08-18)

### 🚀 Features

* **wizard:** add opt-in baseline NetworkPolicy toggle for EKS ([#47](https://github.com/devopsgroupeu/openprime-app/issues/47)) ([be0c21a](https://github.com/devopsgroupeu/openprime-app/commit/be0c21acb8998e5c01ff75f3f94f267a45e24e85))

## [1.16.3](https://github.com/devopsgroupeu/openprime-app/compare/v1.16.2...v1.16.3) (2026-08-17)

### 🐛 Bug Fixes

* formatting and tests fix ([2a31b5c](https://github.com/devopsgroupeu/openprime-app/commit/2a31b5ce6b7efe3aa3b18b1327a6f675d2701bec))

### ♻️ Code Refactoring

* **settings:** address PR feedback and split tab components ([43f0f3a](https://github.com/devopsgroupeu/openprime-app/commit/43f0f3a555e6776d29ec741b1d3376f0546a3484))

## [1.16.2](https://github.com/devopsgroupeu/openprime-app/compare/v1.16.1...v1.16.2) (2026-08-12)

### 🐛 Bug Fixes

* **auth:** tell the truth during a Keycloak outage and retry refresh before logging out ([#45](https://github.com/devopsgroupeu/openprime-app/issues/45)) ([5691f56](https://github.com/devopsgroupeu/openprime-app/commit/5691f56f6212acfffcff8f03f7f7aa96d4458d35))
* **config:** make database deletion protection, final snapshots and managed passwords the default ([#46](https://github.com/devopsgroupeu/openprime-app/issues/46)) ([1f0deb7](https://github.com/devopsgroupeu/openprime-app/commit/1f0deb78618d8fc110e5556f46de39d89da3eae3))

## [1.16.1](https://github.com/devopsgroupeu/openprime-app/compare/v1.16.0...v1.16.1) (2026-08-12)

### 🐛 Bug Fixes

* **ui:** stop claiming charts are deployed and custom values are applied ([#44](https://github.com/devopsgroupeu/openprime-app/issues/44)) ([6039c2e](https://github.com/devopsgroupeu/openprime-app/commit/6039c2e278e9c4b81a22255b04a2f3fa6fb3dd67))

## [1.16.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.15.0...v1.16.0) (2026-08-12)

### 🚀 Features

* **security:** keep the git deploy key out of the browser, the export and localStorage ([#42](https://github.com/devopsgroupeu/openprime-app/issues/42)) ([961f1bb](https://github.com/devopsgroupeu/openprime-app/commit/961f1bbd67ff7edfd15f79016e4671bf9cd1bfdf))

## [1.15.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.14.0...v1.15.0) (2026-08-11)

### 🚀 Features

* **security:** add a runtime-templated Content-Security-Policy ([#41](https://github.com/devopsgroupeu/openprime-app/issues/41)) ([84e32de](https://github.com/devopsgroupeu/openprime-app/commit/84e32de16d41e0fc795714eb790d5a8e11b827e4))

## [1.14.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.13.6...v1.14.0) (2026-08-10)

### 🚀 Features

* **wizard:** auto-suggest global prefix from environment name ([80ee796](https://github.com/devopsgroupeu/openprime-app/commit/80ee796769baac18e9f52b5f3f65e9b3bfeb9241))

## [1.13.6](https://github.com/devopsgroupeu/openprime-app/compare/v1.13.5...v1.13.6) (2026-08-10)

### 📚 Documentation

* correct app meta description to AWS-first (OP-149) ([#39](https://github.com/devopsgroupeu/openprime-app/issues/39)) ([8821067](https://github.com/devopsgroupeu/openprime-app/commit/88210671ae63becf347b33a6db20a8a80c9d6d72))

## [1.13.5](https://github.com/devopsgroupeu/openprime-app/compare/v1.13.4...v1.13.5) (2026-08-10)

### 🐛 Bug Fixes

* gate on-premise provider behind roadmap label (OP-182) ([#38](https://github.com/devopsgroupeu/openprime-app/issues/38)) ([df5997f](https://github.com/devopsgroupeu/openprime-app/commit/df5997fa1809f2b2bcba0c84809fb5ee5d70118f))

## [1.13.4](https://github.com/devopsgroupeu/openprime-app/compare/v1.13.3...v1.13.4) (2026-08-10)

### 🐛 Bug Fixes

* add security headers, stop shipping source maps, remove the HTML-injection sink ([#37](https://github.com/devopsgroupeu/openprime-app/issues/37)) ([027c2e1](https://github.com/devopsgroupeu/openprime-app/commit/027c2e19ca7c686ce609895a496e8720e095d34d))

## [1.13.3](https://github.com/devopsgroupeu/openprime-app/compare/v1.13.2...v1.13.3) (2026-07-27)

### 🐛 Bug Fixes

* **nginx:** stop caching index.html so releases reach users immediately ([#35](https://github.com/devopsgroupeu/openprime-app/issues/35)) ([51056c8](https://github.com/devopsgroupeu/openprime-app/commit/51056c899f5e120a9fb263f8280145aefff24456))

## [1.13.2](https://github.com/devopsgroupeu/openprime-app/compare/v1.13.1...v1.13.2) (2026-07-27)

### 🐛 Bug Fixes

* **wizard:** normalize API shape and lock name/prefix in edit mode ([#34](https://github.com/devopsgroupeu/openprime-app/issues/34)) ([807de84](https://github.com/devopsgroupeu/openprime-app/commit/807de84290badc3f0b5860e3f1f18e5abe7a3f12))

## [1.13.1](https://github.com/devopsgroupeu/openprime-app/compare/v1.13.0...v1.13.1) (2026-07-09)

### ♻️ Code Refactoring

* **helm:** align chart catalog to infra-templates, disable defaults, drop dead code ([#33](https://github.com/devopsgroupeu/openprime-app/issues/33)) ([5197d7f](https://github.com/devopsgroupeu/openprime-app/commit/5197d7f614cb283873bf53286f02a82d4140ec45))

## [1.13.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.12.4...v1.13.0) (2026-07-07)

### 🚀 Features

* **logging:** add JSON access logs to the frontend nginx container ([#32](https://github.com/devopsgroupeu/openprime-app/issues/32)) ([8c62b95](https://github.com/devopsgroupeu/openprime-app/commit/8c62b958f724277d16481cc3d5c11039ef7baaad))

## [1.12.4](https://github.com/devopsgroupeu/openprime-app/compare/v1.12.3...v1.12.4) (2026-07-04)

### ♻️ Code Refactoring

* split WizardPage into sidebar, footer, step-content, and step defs ([#31](https://github.com/devopsgroupeu/openprime-app/issues/31)) ([4881d91](https://github.com/devopsgroupeu/openprime-app/commit/4881d91c5c015d313fb59a8db109b58fd4fe167a))

## [1.12.3](https://github.com/devopsgroupeu/openprime-app/compare/v1.12.2...v1.12.3) (2026-07-04)

### ♻️ Code Refactoring

* extract AIChatModal suggestion logic and message UI into modules ([#30](https://github.com/devopsgroupeu/openprime-app/issues/30)) ([54b0591](https://github.com/devopsgroupeu/openprime-app/commit/54b05919c52637b7321a34d5e2460bec9d7e8aff))

## [1.12.2](https://github.com/devopsgroupeu/openprime-app/compare/v1.12.1...v1.12.2) (2026-07-04)

### ♻️ Code Refactoring

* split BasicConfigStep wizard step into presentational sections ([#29](https://github.com/devopsgroupeu/openprime-app/issues/29)) ([a024384](https://github.com/devopsgroupeu/openprime-app/commit/a0243841d1aaace81d29f46ff52270329e2427d1))

## [1.12.1](https://github.com/devopsgroupeu/openprime-app/compare/v1.12.0...v1.12.1) (2026-07-03)

### ♻️ Code Refactoring

* split servicesConfig into per-provider service modules ([#28](https://github.com/devopsgroupeu/openprime-app/issues/28)) ([7501731](https://github.com/devopsgroupeu/openprime-app/commit/7501731175241088b2d2d987fc235c720631538b))

## [1.12.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.11.1...v1.12.0) (2026-07-02)

### 🚀 Features

* harden credential modal + availability (PDB, graceful shutdown) ([#27](https://github.com/devopsgroupeu/openprime-app/issues/27)) ([c9129fc](https://github.com/devopsgroupeu/openprime-app/commit/c9129fc9b85ad0674af3844039c6a2d58330a594))

## [1.11.1](https://github.com/devopsgroupeu/openprime-app/compare/v1.11.0...v1.11.1) (2026-06-29)

### 🐛 Bug Fixes

* **app:** release UI redesign polish + helm template & wizard-scroll fixes ([7086c66](https://github.com/devopsgroupeu/openprime-app/commit/7086c66b6161b585d4649651e5fa837618c90cd4)), closes [#24](https://github.com/devopsgroupeu/openprime-app/issues/24)
* **app:** unregister stale MSW service worker when not in mock mode ([72c4eaa](https://github.com/devopsgroupeu/openprime-app/commit/72c4eaa367d8dadade42ee7cd9fda4180407b539)), closes [#24](https://github.com/devopsgroupeu/openprime-app/issues/24)

## [1.11.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.10.0...v1.11.0) (2026-06-29)

### 🚀 Features

* **app:** InfraFlow UI redesign (shell, page wizard, detail, cards, mobile nav) ([6fa7cbb](https://github.com/devopsgroupeu/openprime-app/commit/6fa7cbb2dbeccf8fc3a32201fe474aaea42832a3))

### 🐛 Bug Fixes

* **ci:** pin prettier printWidth to 80 (resolve editorconfig/CI formatting divergence) ([d665d32](https://github.com/devopsgroupeu/openprime-app/commit/d665d32f1bfa308795bbbbdb8cc0f0e96b9f7765))

## [1.10.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.9.2...v1.10.0) (2026-06-25)

### 🚀 Features

* **app:** add a mock-mode FE test harness to run and test without backend or Keycloak ([#20](https://github.com/devopsgroupeu/openprime-app/issues/20)) ([2eeebc5](https://github.com/devopsgroupeu/openprime-app/commit/2eeebc55463978fd83a39c8d7b220c37aad15400))

## [1.9.2](https://github.com/devopsgroupeu/openprime-app/compare/v1.9.1...v1.9.2) (2026-06-25)

### 📚 Documentation

* add .env.example documenting required environment variables ([#18](https://github.com/devopsgroupeu/openprime-app/issues/18)) ([cc1c1f1](https://github.com/devopsgroupeu/openprime-app/commit/cc1c1f19f2e877f18369b645229b8c21f9fe8e85))

## [1.9.1](https://github.com/devopsgroupeu/openprime-app/compare/v1.9.0...v1.9.1) (2026-06-25)

### 🐛 Bug Fixes

* **wizard:** hide Lambda service (generated lambda.tf needs user-provided .zip packages) ([#17](https://github.com/devopsgroupeu/openprime-app/issues/17)) ([a3831d6](https://github.com/devopsgroupeu/openprime-app/commit/a3831d627c90e93977118aaf607ee0a9e6b0c358))

## [1.9.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.8.0...v1.9.0) (2026-06-23)

### 🚀 Features

* **config:** add EKS Kubernetes 1.35 version option ([#16](https://github.com/devopsgroupeu/openprime-app/issues/16)) ([21b1f51](https://github.com/devopsgroupeu/openprime-app/commit/21b1f51ba8be51c50d450d8b4b37eef11c189402))

## [1.8.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.7.0...v1.8.0) (2026-03-10)

### 🚀 Features

* **Auth:** enhance authentication handling with token refresh and logout improvements ([101bda6](https://github.com/devopsgroupeu/openprime-app/commit/101bda6e2e1a09a68174508aa75e519c41b7080e))

## [1.7.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.6.0...v1.7.0) (2026-03-09)

### 🚀 Features

* **EnvironmentConfiguration:** enhance configuration generation with additional environment properties ([4b1c601](https://github.com/devopsgroupeu/openprime-app/commit/4b1c601473ca1e3c016419531cda0ba7beb32c56))

## [1.6.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.5.3...v1.6.0) (2026-03-09)

### 🚀 Features

* **ExternalDNS:** add configuration for External DNS management in Kubernetes ([a2c1964](https://github.com/devopsgroupeu/openprime-app/commit/a2c1964dbb31b2d191713889fb77b9dbd1feaba3))

## [1.5.3](https://github.com/devopsgroupeu/openprime-app/compare/v1.5.2...v1.5.3) (2026-03-09)

### ♻️ Code Refactoring

* **BasicConfigStep:** update deployment prerequisites and CI/CD environment variable instructions ([a62e8a5](https://github.com/devopsgroupeu/openprime-app/commit/a62e8a50f503ceea7605aef5afb6894eca1a8772))

## [1.5.2](https://github.com/devopsgroupeu/openprime-app/compare/v1.5.1...v1.5.2) (2026-03-06)

### ♻️ Code Refactoring

* **BasicConfigStep:** improve warning callout layout and styling ([c735096](https://github.com/devopsgroupeu/openprime-app/commit/c735096768be31133f3aeac1ac6ee9376f7578a0))

## [1.5.1](https://github.com/devopsgroupeu/openprime-app/compare/v1.5.0...v1.5.1) (2026-03-06)

### 🐛 Bug Fixes

* remove phantom features, add quick actions and SSH key rotation ([#15](https://github.com/devopsgroupeu/openprime-app/issues/15)) ([4d930aa](https://github.com/devopsgroupeu/openprime-app/commit/4d930aa96bcb2153335f7161d89cadc061bca9f0))

## [1.5.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.4.0...v1.5.0) (2026-03-04)

### 🚀 Features

* **git_integration:** enhance Git integration in settings and wizard steps, update tests ([832e3f7](https://github.com/devopsgroupeu/openprime-app/commit/832e3f79471ea567fd98eedc180eecaa87bc5bc4))

## [1.4.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.3.0...v1.4.0) (2026-03-03)

### 🚀 Features

* **tf_backend:** set s3 locking as default, modify UI ([ba30c6e](https://github.com/devopsgroupeu/openprime-app/commit/ba30c6efad4799992e8fb3db43b318b0ac587cca))

## [1.3.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.2.0...v1.3.0) (2026-03-03)

### 🚀 Features

* **OPE-138:** git push functionality ([#13](https://github.com/devopsgroupeu/openprime-app/issues/13)) ([5001ff7](https://github.com/devopsgroupeu/openprime-app/commit/5001ff78535d8b5bb585963e1a5230daef3f7619))

## [1.2.0](https://github.com/devopsgroupeu/openprime-app/compare/v1.1.2...v1.2.0) (2026-03-03)

### 🚀 Features

* **cicd/npm:** upgrade npm packages, mirror cicd setup from openprime-app-backend, use vite instead of CRA ([#14](https://github.com/devopsgroupeu/openprime-app/issues/14)) ([56d1a8c](https://github.com/devopsgroupeu/openprime-app/commit/56d1a8cdd2fc6fdf47c46ff4e8f19ac8c8a072a5))

## <small>1.1.2 (2026-01-19)</small>

* fix(ci): use Chart.yaml version for push/workflow_dispatch events ([5534c0d](https://github.com/devopsgroupeu/openprime-app/commit/5534c0d))
* ci(helm): add workflow_dispatch trigger for manual runs ([352f233](https://github.com/devopsgroupeu/openprime-app/commit/352f233))

## <small>1.1.1 (2026-01-19)</small>

* fix(ci): force fetch tags and release only from main ([9a3cbb9](https://github.com/devopsgroupeu/openprime-app/commit/9a3cbb9))
* fix(release): configure semantic-release for main branch only ([99c515c](https://github.com/devopsgroupeu/openprime-app/commit/99c515c))
* ci(helm): remove duplicate helm-release workflow ([87bc67e](https://github.com/devopsgroupeu/openprime-app/commit/87bc67e))

## 1.1.0 (2025-12-19)

* feat: update helmChartsConfig, modify e2e tests, allow to specify existing S3 bucket ([c784984](https://github.com/devopsgroupeu/openprime-app/commit/c784984))

## 1.0.0 (2025-12-19)

* feat: add cloud credentials UI and integration ([297230b](https://github.com/devopsgroupeu/openprime-app/commit/297230b))
* feat: add Git repository configuration and Terraform backend display ([4e71dd8](https://github.com/devopsgroupeu/openprime-app/commit/4e71dd8))
* feat: add OpenPrime branding and comprehensive favicon system ([a93cd93](https://github.com/devopsgroupeu/openprime-app/commit/a93cd93)), closes [#35B0A0](https://github.com/devopsgroupeu/openprime-app/issues/35B0A0) [hi#quality](https://github.com/hi/issues/quality)
* feat: add Terraform backend configuration with S3 and DynamoDB support ([4bed821](https://github.com/devopsgroupeu/openprime-app/commit/4bed821))
* feat: e2e tests, modify configs for helmcharts and aws services ([b04a03e](https://github.com/devopsgroupeu/openprime-app/commit/b04a03e))
* feat: implement comprehensive design system with CSS variables ([dd74259](https://github.com/devopsgroupeu/openprime-app/commit/dd74259))
* feat(config): consolidate environment variables and enhance containerization ([0c2cecf](https://github.com/devopsgroupeu/openprime-app/commit/0c2cecf))
* feat(helm): add enabled flag for helm charts with disabled UI state ([89a014f](https://github.com/devopsgroupeu/openprime-app/commit/89a014f))
* feat(OPE-106): align services config with infra-templates (#11) ([251100c](https://github.com/devopsgroupeu/openprime-app/commit/251100c)), closes [#11](https://github.com/devopsgroupeu/openprime-app/issues/11) [#9](https://github.com/devopsgroupeu/openprime-app/issues/9) [#10](https://github.com/devopsgroupeu/openprime-app/issues/10) [#35B0A0](https://github.com/devopsgroupeu/openprime-app/issues/35B0A0) [hi#quality](https://github.com/hi/issues/quality)
* feat(settings): add toast notifications for credential operations ([2528209](https://github.com/devopsgroupeu/openprime-app/commit/2528209))
* feat(wizard): add global prefix field for resource naming ([0a9728c](https://github.com/devopsgroupeu/openprime-app/commit/0a9728c))
* chore: update health check interval and add z-index scale ([e61bf82](https://github.com/devopsgroupeu/openprime-app/commit/e61bf82))
* added azure ([f406a9b](https://github.com/devopsgroupeu/openprime-app/commit/f406a9b))
* added calling of backend during creation of environment ([1f43754](https://github.com/devopsgroupeu/openprime-app/commit/1f43754))
* added chart ([fecc0b1](https://github.com/devopsgroupeu/openprime-app/commit/fecc0b1))
* added chatbot, redefined creation of environment ([385cb58](https://github.com/devopsgroupeu/openprime-app/commit/385cb58))
* added dynamicaly managed services ([a3ff7e1](https://github.com/devopsgroupeu/openprime-app/commit/a3ff7e1))
* added environment detail page ([4e7c129](https://github.com/devopsgroupeu/openprime-app/commit/4e7c129))
* added gh actions ([0d29dbd](https://github.com/devopsgroupeu/openprime-app/commit/0d29dbd))
* added gh actions ([f9bcb13](https://github.com/devopsgroupeu/openprime-app/commit/f9bcb13))
* added integration with injecto ([14419ca](https://github.com/devopsgroupeu/openprime-app/commit/14419ca))
* added keycloak auth and db ([c8824af](https://github.com/devopsgroupeu/openprime-app/commit/c8824af))
* added light theme and possibility to delete env ([b603fe2](https://github.com/devopsgroupeu/openprime-app/commit/b603fe2))
* added possibility to edit env ([0d9c79a](https://github.com/devopsgroupeu/openprime-app/commit/0d9c79a))
* added routing ([16246c8](https://github.com/devopsgroupeu/openprime-app/commit/16246c8))
* added toasts, make improvements in theme consistency ([711e4ed](https://github.com/devopsgroupeu/openprime-app/commit/711e4ed))
* Added validation of set values to avoid deployment issues ([4ef95f1](https://github.com/devopsgroupeu/openprime-app/commit/4ef95f1))
* Added validation of set values to avoid deployment issues ([ff0fb5b](https://github.com/devopsgroupeu/openprime-app/commit/ff0fb5b))
* Added validation of set values to avoid deployment issues ([c206762](https://github.com/devopsgroupeu/openprime-app/commit/c206762))
* Added validation of set values to avoid deployment issues ([1b28aeb](https://github.com/devopsgroupeu/openprime-app/commit/1b28aeb))
* AI implemented to env configuration ([63998cf](https://github.com/devopsgroupeu/openprime-app/commit/63998cf))
* AI implemented to env configuration ([fe6f9e3](https://github.com/devopsgroupeu/openprime-app/commit/fe6f9e3))
* Aura chat history added ([b49079c](https://github.com/devopsgroupeu/openprime-app/commit/b49079c))
* BE - AI integration to chatbot ([eefba97](https://github.com/devopsgroupeu/openprime-app/commit/eefba97))
* BE - AI integration to chatbot ([6270f6b](https://github.com/devopsgroupeu/openprime-app/commit/6270f6b))
* change ([ddfd2ea](https://github.com/devopsgroupeu/openprime-app/commit/ddfd2ea))
* change ([67e2ef4](https://github.com/devopsgroupeu/openprime-app/commit/67e2ef4))
* change ([9e74228](https://github.com/devopsgroupeu/openprime-app/commit/9e74228))
* changed color theme ([b10749e](https://github.com/devopsgroupeu/openprime-app/commit/b10749e))
* changed theme to teal ([19c6a40](https://github.com/devopsgroupeu/openprime-app/commit/19c6a40))
* changes for AWS only app ([a174272](https://github.com/devopsgroupeu/openprime-app/commit/a174272))
* Chat history for each service added ([13f699a](https://github.com/devopsgroupeu/openprime-app/commit/13f699a))
* Chat history for each service added ([c092498](https://github.com/devopsgroupeu/openprime-app/commit/c092498))
* Enable AI chat to suggest and update service configuration values ([e70036b](https://github.com/devopsgroupeu/openprime-app/commit/e70036b))
* Enable AI chat to suggest and update service configuration values ([fd45450](https://github.com/devopsgroupeu/openprime-app/commit/fd45450))
* first commit ([1e20f63](https://github.com/devopsgroupeu/openprime-app/commit/1e20f63))
* Fix - duplicate confirmaton message in responses ([687ca7b](https://github.com/devopsgroupeu/openprime-app/commit/687ca7b))
* Fix - duplicate confirmaton message in responses ([4088914](https://github.com/devopsgroupeu/openprime-app/commit/4088914))
* FIX - suggestion is shown every time json appears in message ([1bbca95](https://github.com/devopsgroupeu/openprime-app/commit/1bbca95))
* fixed tests ([a62bf96](https://github.com/devopsgroupeu/openprime-app/commit/a62bf96))
* fixed tests ([9d51cfe](https://github.com/devopsgroupeu/openprime-app/commit/9d51cfe))
* Fixed UI bugs ([787f645](https://github.com/devopsgroupeu/openprime-app/commit/787f645))
* Initialize project using Create React App ([8465047](https://github.com/devopsgroupeu/openprime-app/commit/8465047))
* Logic changed ([db53767](https://github.com/devopsgroupeu/openprime-app/commit/db53767))
* Logic changed ([81aa7d8](https://github.com/devopsgroupeu/openprime-app/commit/81aa7d8))
* Merge branch 'feature/OPE-100/Integrate-AI-to-Chatbot-on-FE' of https://github.com/devopsgroupeu/ope ([19df0ed](https://github.com/devopsgroupeu/openprime-app/commit/19df0ed))
* Merge pull request #5 from devopsgroupeu/feature/OPE-100/Integrate-AI-to-Chatbot-on-FE ([23895ab](https://github.com/devopsgroupeu/openprime-app/commit/23895ab)), closes [#5](https://github.com/devopsgroupeu/openprime-app/issues/5)
* Merge pull request #7 from devopsgroupeu/feature/OPE-100/Integrate-AI-to-Chatbot-on-FE ([5b9ec83](https://github.com/devopsgroupeu/openprime-app/commit/5b9ec83)), closes [#7](https://github.com/devopsgroupeu/openprime-app/issues/7)
* Modal chat reads set values ([6f62a5a](https://github.com/devopsgroupeu/openprime-app/commit/6f62a5a))
* Modal chat reads set values ([ff85ffd](https://github.com/devopsgroupeu/openprime-app/commit/ff85ffd))
* Modal chat topic added ([88afff6](https://github.com/devopsgroupeu/openprime-app/commit/88afff6))
* Modal chat topic added ([a1ab0aa](https://github.com/devopsgroupeu/openprime-app/commit/a1ab0aa))
* Options validation added ([c5f5e37](https://github.com/devopsgroupeu/openprime-app/commit/c5f5e37))
* Options validation added ([e98fc54](https://github.com/devopsgroupeu/openprime-app/commit/e98fc54))
* Options validation added ([69c21b5](https://github.com/devopsgroupeu/openprime-app/commit/69c21b5))
* Options validation added ([4c070d6](https://github.com/devopsgroupeu/openprime-app/commit/4c070d6))
* Output fix ([dde6571](https://github.com/devopsgroupeu/openprime-app/commit/dde6571))
* Output fix ([93356ba](https://github.com/devopsgroupeu/openprime-app/commit/93356ba))
* redesigned env detail ([ecff637](https://github.com/devopsgroupeu/openprime-app/commit/ecff637))
* removed extra nginx chart ([6452f61](https://github.com/devopsgroupeu/openprime-app/commit/6452f61))
* updated AWS config file ([0dbf22d](https://github.com/devopsgroupeu/openprime-app/commit/0dbf22d))
* updated chart ingress ([b0d32ce](https://github.com/devopsgroupeu/openprime-app/commit/b0d32ce))
* updated version and removed unused code ([21ab516](https://github.com/devopsgroupeu/openprime-app/commit/21ab516))
* updated version of lucid ([0444cec](https://github.com/devopsgroupeu/openprime-app/commit/0444cec))
* updated version of node ([033a231](https://github.com/devopsgroupeu/openprime-app/commit/033a231))
* refactor: update components to adopt new design system ([fa6a3c3](https://github.com/devopsgroupeu/openprime-app/commit/fa6a3c3))
* refactor(ui): delegate API calls to parent in EnvironmentsPage ([cba3709](https://github.com/devopsgroupeu/openprime-app/commit/cba3709))
* docs: reorganize documentation into docs/ directory ([28c0674](https://github.com/devopsgroupeu/openprime-app/commit/28c0674))
* fix(docker): resolve read-only filesystem compatibility for containerized deployments ([4fe995e](https://github.com/devopsgroupeu/openprime-app/commit/4fe995e))
