import { describeError, serverMessage } from "../describe-error";

describe("describeError", () => {
  it("asks to check the connection when no response arrived", () => {
    expect(
      describeError(new TypeError("Failed to fetch"), "test aws-sandbox"),
    ).toBe("Couldn't test aws-sandbox. Check your connection and try again.");
  });

  it("prefixes the server message and names the error ID", () => {
    const error = Object.assign(new Error("HTTP error! status: 409"), {
      status: 409,
      data: { error: "Credential is locked" },
      requestId: "req-42",
    });

    expect(describeError(error, "delete aws-sandbox")).toBe(
      "Couldn't delete aws-sandbox: Credential is locked (Error ID: req-42)",
    );
  });

  // authService's placeholder when the body had no message says nothing.
  it("treats the bare HTTP status message as no message", () => {
    const error = Object.assign(new Error("HTTP error! status: 502"), {
      status: 502,
      requestId: "req-7",
    });

    expect(describeError(error, "save your changes")).toBe(
      "Couldn't save your changes. Try again. (Error ID: req-7)",
    );
  });

  // Only a failed fetch is a connection problem; another TypeError is a bug.
  it("reads only a fetch failure as a connection problem", () => {
    expect(
      describeError(
        new TypeError("NetworkError when attempting to fetch resource."),
        "load environments",
      ),
    ).toBe("Couldn't load environments. Check your connection and try again.");
    expect(
      describeError(new TypeError("Load failed"), "load environments"),
    ).toBe("Couldn't load environments. Check your connection and try again.");
    expect(
      describeError(
        new TypeError("Cannot read properties of undefined (reading 'id')"),
        "load environments",
      ),
    ).toBe("Couldn't load environments. Try again.");
  });

  it("falls back to the error message, then to try again", () => {
    expect(describeError(new Error("Server said no"), "delete demo")).toBe(
      "Couldn't delete demo: Server said no",
    );
    expect(describeError(new Error(""), "delete demo")).toBe(
      "Couldn't delete demo. Try again.",
    );
  });
});

// The load errors and the job callout show what the server said, and only that.
describe("serverMessage", () => {
  it("is the server's message, nothing for a placeholder or no response", () => {
    expect(
      serverMessage(
        Object.assign(new Error("HTTP error! status: 409"), {
          data: { error: "Credential is locked" },
        }),
      ),
    ).toBe("Credential is locked");
    expect(serverMessage(new Error("Terraform apply failed"))).toBe(
      "Terraform apply failed",
    );
    expect(serverMessage(new Error("HTTP error! status: 502"))).toBe("");
    expect(serverMessage(new TypeError("Failed to fetch"))).toBe("");
  });
});
