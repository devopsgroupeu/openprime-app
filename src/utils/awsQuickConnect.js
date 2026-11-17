// "Connect AWS" without knowing IAM (OP-284, v1). The user pastes one command
// into AWS CloudShell, which already runs as them with the AWS CLI installed.
// It creates (or reuses) an IAM user `openprime`, gives it AdministratorAccess
// and a new access key, and prints one line the user pastes back into
// OpenPrime. v2 replaces the key with a role and OIDC; the clicks stay the same.
//
// The whole command runs in a subshell: `set -e` or `exit` in the user's own
// CloudShell session would close the terminal on the first error.

export const AWS_CLOUDSHELL_URL =
  "https://console.aws.amazon.com/cloudshell/home";

export const AWS_CONNECT_COMMAND = [
  "(",
  "set -e",
  "U=openprime",
  "aws iam get-user --user-name $U >/dev/null 2>&1 || aws iam create-user --user-name $U >/dev/null",
  "aws iam attach-user-policy --user-name $U --policy-arn arn:aws:iam::aws:policy/AdministratorAccess",
  'if [ "$(aws iam list-access-keys --user-name $U --query "length(AccessKeyMetadata)" --output text)" -ge 2 ]; then',
  '  echo "User $U already has 2 access keys. Delete one in IAM > Users > $U > Security credentials, then run this again."; exit 1',
  "fi",
  'K=$(aws iam create-access-key --user-name $U --query "AccessKey.[AccessKeyId,SecretAccessKey]" --output text)',
  "A=$(aws sts get-caller-identity --query Account --output text)",
  "echo; echo \"Copy this line into OpenPrime:\"; echo \"openprime:$A:$(echo $K | tr ' ' ':')\"",
  ")",
].join("\n");

// openprime:<12-digit account>:<access key id>:<secret>. Secrets use base64
// characters and never a colon, so the colon is a safe separator. Matched
// anywhere in the pasted text, so copying a little extra around it still works.
const CONNECT_LINE_RE =
  /openprime:(\d{12}):(A[A-Z0-9]{15,127}):([A-Za-z0-9/+=]{20,})/;

export const parseConnectLine = (text) => {
  const match = CONNECT_LINE_RE.exec(String(text ?? ""));
  if (!match) return null;
  const [, accountId, accessKey, secretKey] = match;
  return { accountId, accessKey, secretKey };
};
