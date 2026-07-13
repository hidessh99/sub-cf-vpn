import { describe, it, expect } from 'vitest';
import { generateUUID, safeBase64Encode, getErrorMessage } from '../utils/common';

describe('Common Utilities', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4 format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('safeBase64Encode', () => {
    it('should encode standard strings to base64', () => {
      const raw = 'hello world';
      const encoded = safeBase64Encode(raw);
      expect(encoded).toBe(btoa(raw));
    });

    it('should handle special characters safely', () => {
      const raw = 'hello 🌏';
      const encoded = safeBase64Encode(raw);
      expect(encoded).not.toBe('');
    });
  });

  describe('getErrorMessage', () => {
    it('should return message from Error instance', () => {
      const err = new Error('Custom Error Message');
      expect(getErrorMessage(err)).toBe('Custom Error Message');
    });

    it('should return message from error-like object', () => {
      const err = { message: 'Object Error Message' };
      expect(getErrorMessage(err)).toBe('Object Error Message');
    });

    it('should convert primitive values to string', () => {
      expect(getErrorMessage('String Error')).toBe('String Error');
      expect(getErrorMessage(500)).toBe('500');
    });
  });
});
