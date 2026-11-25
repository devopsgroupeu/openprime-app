import { describeError } from "../describe-error";

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

  it("falls back to the error message, then to try again", () => {
    expect(describeError(new Error("Server said no"), "delete demo")).toBe(
      "Couldn't delete demo: Server said no",
    );
    expect(describeError(new Error(""), "delete demo")).toBe(
      "Couldn't delete demo. Try again.",
    );
  });
});
