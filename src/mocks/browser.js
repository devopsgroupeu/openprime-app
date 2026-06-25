import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// MSW worker for the browser (mock-mode dev/preview + Playwright).
export const worker = setupWorker(...handlers);
