import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// MSW server for Node (Vitest component/integration tests).
export const server = setupServer(...handlers);
