import crypto from 'crypto';

/**
 * Generates an HMAC SHA-256 signature for n8n webhook authentication
 * @param payload - The JSON payload to sign
 * @param secret - The shared secret key
 * @returns The hex-encoded HMAC signature
 */
export function generateHMACSignature(payload: any, secret: string): string {
  const payloadString = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadString);
  return hmac.digest('hex');
}

/**
 * Verifies an HMAC signature
 * @param payload - The JSON payload
 * @param signature - The signature to verify
 * @param secret - The shared secret key
 * @returns True if the signature is valid
 */
export function verifyHMACSignature(payload: any, signature: string, secret: string): boolean {
  const expectedSignature = generateHMACSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
