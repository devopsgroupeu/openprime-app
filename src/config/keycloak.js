import Keycloak from "keycloak-js";
import { getKeycloakUrl, getKeycloakRealm, getKeycloakClientId } from "../utils/envValidator";

const keycloakConfig = {
  url: getKeycloakUrl(),
  realm: getKeycloakRealm(),
  clientId: getKeycloakClientId(),
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
