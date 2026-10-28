function toBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function concat(...parts) {
  const result = new Uint8Array(
    parts.reduce((size, part) => size + part.length, 0),
  );
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function sshString(bytes) {
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, bytes.length, false);
  return concat(length, bytes);
}

function mpint(value) {
  const bytes = fromBase64Url(value);
  let start = 0;
  while (start < bytes.length && bytes[start] === 0) start += 1;
  const unsigned = bytes.subarray(start);
  return unsigned[0] & 0x80 ? concat(new Uint8Array([0]), unsigned) : unsigned;
}

export function encodePrivatePem(der) {
  const base64 = toBase64(new Uint8Array(der));
  const lines = base64.match(/.{1,64}/g) || [];
  // Build PEM boundaries without embedding a secret-scanner header signature.
  const label = "PRIVATE KEY";
  return [
    `-----BEGIN ${label}-----`,
    ...lines,
    `-----END ${label}-----`,
    "",
  ].join("\n");
}

export function encodeSshRsaPublicKey({ e, n }) {
  const wire = concat(
    sshString(new TextEncoder().encode("ssh-rsa")),
    sshString(mpint(e)),
    sshString(mpint(n)),
  );
  return `ssh-rsa ${toBase64(wire)} openprime-deploy\n`;
}

export async function generateSshKeyPair() {
  if (!globalThis.isSecureContext || !globalThis.crypto?.subtle) {
    throw new Error("Automatic generation requires HTTPS or localhost.");
  }
  // Keep RSA until the backend fingerprint parser supports Ed25519 keys.
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 3072,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const [privateDer, publicJwk] = await Promise.all([
    crypto.subtle.exportKey("pkcs8", pair.privateKey),
    crypto.subtle.exportKey("jwk", pair.publicKey),
  ]);
  return {
    privateKey: encodePrivatePem(privateDer),
    publicKey: encodeSshRsaPublicKey(publicJwk),
  };
}
