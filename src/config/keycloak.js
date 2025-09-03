import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'openprime',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'openprime-app'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
