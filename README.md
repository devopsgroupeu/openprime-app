# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Supply chain

Every image published to `ghcr.io/devopsgroupeu/openprime-app` carries:

- a **keyless [cosign](https://github.com/sigstore/cosign) signature**, made by the publish workflow with GitHub's OIDC identity (no long-lived signing key exists);
- an **SBOM** (SPDX) and **build provenance**, attached to the image as attestations by BuildKit.

Before a release is cut, CI builds the image from the same commit (linux/amd64) and scans it, together with the production dependencies in `package-lock.json`, with Trivy. A fixable HIGH or CRITICAL vulnerability stops the release. Pull requests run the same scan, plus CodeQL (`javascript-typescript`) and `helm lint --strict` + kubeconform on `chart/ci/*-values.yaml`. Dependencies are installed with `npm ci`, which verifies every package against the integrity hashes in the committed lock file.

The image runs as UID/GID 1000 and works with a read-only root filesystem; only `/tmp`, `/var/cache/nginx` and `/var/run` must be writable (the Helm chart mounts them as emptyDirs).

### Verify the signature

Use cosign v3.1.4 or newer (the publish workflow signs with v3.1.4):

```bash
cosign verify ghcr.io/devopsgroupeu/openprime-app:<version> \
  --certificate-identity "https://github.com/devopsgroupeu/openprime-app/.github/workflows/reusable-docker-publish.yml@refs/heads/main" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

Dev images built by `publish.yml` from the `dev` branch are signed with the identity ending in `@refs/heads/dev`.
