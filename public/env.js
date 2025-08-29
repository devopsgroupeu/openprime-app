// This file is processed at container start with envsubst.
// Set REACT_APP_BACKEND_URL when running the container.
// Example: docker run -e REACT_APP_BACKEND_URL=https://api.yourdomain.com/api ...
window._env_ = { BACKEND_URL: "$REACT_APP_BACKEND_URL" };
