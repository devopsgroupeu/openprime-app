import { AWS_CONNECT_COMMAND, parseConnectLine } from "../awsQuickConnect";

// The line below is what AWS_CONNECT_COMMAND printed when run against a stub
// AWS CLI (AWS's documented example key), not something derived from the
// parser, so a change to either side shows up here.
const PRINTED =
  "openprime:123456789012:AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

describe("parseConnectLine", () => {
  it("reads the account, key and secret from the printed line", () => {
    expect(parseConnectLine(PRINTED)).toEqual({
      accountId: "123456789012",
      accessKey: "AKIAIOSFODNN7EXAMPLE",
      secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    });
  });

  it("finds the line inside extra copied text", () => {
    const pasted = `Copy this line into OpenPrime:\n${PRINTED}\n[cloudshell-user@ip ~]$`;
    expect(parseConnectLine(pasted)?.accountId).toBe("123456789012");
  });

  it.each([
    ["empty", ""],
    ["an access key alone", "AKIAIOSFODNN7EXAMPLE"],
    ["an 11-digit account", PRINTED.replace("123456789012", "12345678901")],
    ["a missing secret", "openprime:123456789012:AKIAIOSFODNN7EXAMPLE:"],
  ])("rejects %s", (_, text) => {
    expect(parseConnectLine(text)).toBeNull();
  });
});

describe("AWS_CONNECT_COMMAND", () => {
  it("runs in a subshell so an error cannot close the user's terminal", () => {
    const lines = AWS_CONNECT_COMMAND.split("\n");
    expect(lines[0]).toBe("(");
    expect(lines.at(-1)).toBe(")");
  });

  it("prints the line the parser reads", () => {
    expect(AWS_CONNECT_COMMAND).toContain('echo "openprime:$A:');
  });
});
