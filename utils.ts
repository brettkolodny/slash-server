import nacl from "https://cdn.skypack.dev/tweetnacl@v1.0.3?dts";

// Code from https://deno.com/deploy/docs/tutorial-discord-slash
export async function verifySignature(
  request: Request,
  publicKey: string,
): Promise<{ valid: boolean; body: string }> {
  // Discord sends these headers with every request.
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");
  const body = await request.clone().text();

  if (!signature || !timestamp) {
    return { valid: false, body };
  }

  const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(publicKey),
  );

  return { valid, body };
}

// Code from https://deno.com/deploy/docs/tutorial-discord-slash
function hexToUint8Array(hex: string) {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)));
}
