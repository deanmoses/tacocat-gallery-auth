/*
    PKCE (RFC 7636) and the OAuth `state` parameter (RFC 6749 §10.12).

    Both are opaque secrets minted when a login starts and checked when Cognito
    calls back. Using them together prevents an authorization code stolen or
    injected into the callback from being redeemed for tokens.
*/
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function generateCodeVerifier(): string {
    // 32 bytes -> 43 base64url chars, the length RFC 7636 recommends
    return randomBytes(32).toString('base64url');
}

export function codeChallenge(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url');
}

export function generateState(): string {
    return randomBytes(16).toString('base64url');
}

/**
 * Compare two secrets without leaking their length or first mismatched byte
 * through timing. timingSafeEqual itself requires equal lengths.
 */
export function secretsMatch(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
