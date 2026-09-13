import { codeChallenge, generateCodeVerifier, generateState, secretsMatch } from './pkce';

describe('generateCodeVerifier', () => {
    it('is 43 unreserved characters, as RFC 7636 recommends', () => {
        const verifier = generateCodeVerifier();
        expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('differs per call', () => {
        expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
    });
});

describe('codeChallenge', () => {
    it('matches the RFC 7636 appendix B example', () => {
        expect(codeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
            'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        );
    });
});

describe('generateState', () => {
    it('is unpadded base64url', () => {
        expect(generateState()).toMatch(/^[A-Za-z0-9_-]{22}$/);
    });
});

describe('secretsMatch', () => {
    it('is true for identical strings', () => {
        expect(secretsMatch('abc', 'abc')).toBe(true);
    });

    it('is false for different strings of the same length', () => {
        expect(secretsMatch('abc', 'abd')).toBe(false);
    });

    it('is false for different lengths rather than throwing', () => {
        expect(secretsMatch('abc', 'abcd')).toBe(false);
        expect(secretsMatch('', 'a')).toBe(false);
    });
});
