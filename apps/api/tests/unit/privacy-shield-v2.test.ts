import { describe, it, expect } from 'vitest';
import { scanPrivacyShieldV2, normalizeText } from '@p11/shared';

describe('Task 6: Privacy Shield V2 — 100+ Adversarial Evasion Test Suite', () => {
  describe('Unicode & Zero-Width Normalization', () => {
    it('should strip zero-width spaces and normalize NFKC full-width characters', () => {
      const input = 'contact\u200Bme\u200Cat\u200Dtest\uFEFF@example.com';
      const normalized = normalizeText(input);
      expect(normalized).toBe('contactmeattest@example.com');
    });
  });

  describe('1. Obfuscated Emails (25 Test Fixtures)', () => {
    const obfuscatedEmailFixtures = [
      'Reach me at alex at gmail dot com',
      'alex[at]gmail[dot]com',
      'alex(at)gmail(dot)com',
      'alex @ gmail . com',
      'alex.smith at university dot edu',
      'alex_smith[at]domain[dot]org',
      'contact: john.doe AT techcompany DOT io',
      'email me at jane.mentor(at)alumni(dot)edu',
      'jane[at]ai[dot]co',
      'my email is dev.lead at startup dot ai',
      'reach me: dev_pro at enterprise dot net',
      'personal mail: student123 AT college DOT in',
      'student.test[at]iit[dot]ac[dot]in',
      'alex.test (at) outlook (dot) com',
      'contact at user-name[at]yahoo[dot]com',
      'alex\u200B@\u200Cgmail\u200D.com',
      'alex\uFEFFsmith@domain.com',
      'alex [dot] dev [at] google [dot] com',
      'email: contact.us (at) company (dot) info',
      'alex_dev AT protonmail DOT me',
      'write to alex.work at bigtech dot biz',
      'alex.mentor[at]alum[dot]mit[dot]edu',
      'ping me at alex.cloud AT aws DOT com',
      'email: admin (at) university (dot) gov',
      'alex at fastmail dot com',
    ];

    obfuscatedEmailFixtures.forEach((fixture, idx) => {
      it(`Fixture #${idx + 1}: should detect & mask email: "${fixture}"`, () => {
        const result = scanPrivacyShieldV2(fixture);
        expect(result.hasPII).toBe(true);
        expect(result.cleanText).toContain('[CONTACT DETAIL REDACTED]');
      });
    });
  });

  describe('2. Phone Numbers & Spelled-Out Word Digits (25 Test Fixtures)', () => {
    const phoneFixtures = [
      'Call me at +91 9876543210',
      'My number is 9876543210',
      'WhatsApp: +91-98765-43210',
      'Ring me at (987) 654-3210',
      'Phone: 987-654-3210',
      'Call +1 (555) 123-4567',
      '9 8 7 6 5 4 3 2 1 0',
      '9.8.7.6.5.4.3.2.1.0',
      '9-8-7-6-5-4-3-2-1-0',
      'call me: 9 1 9 8 7 6 5 4 3 2 1 0',
      'nine eight seven six five four three two one zero',
      'nine eight seven six five four three two one zero call me',
      'my contact is +91nine eight seven six five four three two one zero',
      '+44 20 7946 0958',
      '+91 80000 12345',
      'call at 98765 43210',
      '98765\u200B43210',
      '09876543210',
      'reach phone: +91 91234 56789',
      'phone number 98765.43210',
      'nine eight seven six five four three two one zero ring me',
      '+91 9988776655',
      '+1-800-555-0199',
      'call 9876 543 210',
      '+91 (98765) 43210',
    ];

    phoneFixtures.forEach((fixture, idx) => {
      it(`Fixture #${idx + 1}: should detect & mask phone: "${fixture}"`, () => {
        const result = scanPrivacyShieldV2(fixture);
        expect(result.hasPII).toBe(true);
        expect(result.cleanText).toContain('[PHONE NUMBER REDACTED]');
      });
    });
  });

  describe('3. Indian & Global UPI Handles (20 Test Fixtures)', () => {
    const upiFixtures = [
      'Pay fees at student@oksbi',
      'Send to mentor@okhdfcbank',
      'upi: alex@okicici',
      'paytm handle: rahul@paytm',
      'john@ybl',
      'fees@ibl',
      'alex@upi',
      'pay via user123@apl',
      'alex.smith@axl',
      'donations@federal',
      'mentor.fee@sbi',
      'transfer to alex@hdfc',
      'account is mentor@icici',
      'user@axis',
      'upi: rahul.kumar@oksbi',
      'pay me: alex99@okaxis',
      'my upi id is dev@paytm',
      'support@ybl please send',
      'user.corp@upi',
      'transfer to test.user@apl',
    ];

    upiFixtures.forEach((fixture, idx) => {
      it(`Fixture #${idx + 1}: should detect & mask UPI handle: "${fixture}"`, () => {
        const result = scanPrivacyShieldV2(fixture);
        expect(result.hasPII).toBe(true);
        expect(result.cleanText).toContain('[CONTACT DETAIL REDACTED]');
      });
    });
  });

  describe('4. Social Media Links & Chat Handles (20 Test Fixtures)', () => {
    const socialFixtures = [
      'Connect on linkedin: linkedin.com/in/alex-smith-dev',
      'https://www.linkedin.com/in/jane-mentor-123/',
      'Ping me on telegram: t.me/alexsmith',
      'https://t.me/techmentor',
      'telegram.me/devlead',
      'wa.me/919876543210',
      'https://wa.me/15551234567',
      'chat.whatsapp.com/INVITECODE123',
      'Instagram: instagram.com/alex_photos',
      'https://instagr.am/mentor_jane',
      'twitter.com/dev_alex',
      'x.com/tech_lead',
      'discord.gg/studentcoder',
      'https://discord.com/invite/mentorship',
      'telegram: @alex_tele',
      'insta: @coder_girl',
      'whatsapp: @9876543210',
      'github: github.com/alexsmith/profile',
      'snap: @alex_snap',
      'tg: @lead_mentor',
    ];

    socialFixtures.forEach((fixture, idx) => {
      it(`Fixture #${idx + 1}: should detect & mask social link/handle: "${fixture}"`, () => {
        const result = scanPrivacyShieldV2(fixture);
        expect(result.hasPII).toBe(true);
        expect(result.cleanText).toContain('[CONTACT DETAIL REDACTED]');
      });
    });
  });

  describe('5. False Positive Protection — Legitimate Academic & Technical Messages (15 Test Fixtures)', () => {
    const legitimateMessages = [
      'We can discuss algorithm time complexity O(n log n) and space complexity O(1).',
      'My undergraduate cumulative GPA is 3.85 out of 4.0.',
      'I have 5 years of professional experience using Node.js, TypeScript, and AWS EC2.',
      'Please read Chapter 4 page 102 through 150 before our upcoming review.',
      'The model achieved 98.5% precision and 94.2% recall on the benchmark dataset.',
      'Let us meet on Wednesday November 18th at 3pm UTC.',
      'I finished 10 questions on LeetCode today including 3 dynamic programming problems.',
      'The semester starts on August 15 and final examinations end on December 20.',
      'In Python 3.12, the new type syntax is much cleaner than Python 2.7.',
      'Our team deployed microservices across 3 Kubernetes clusters with 99.99% SLA.',
      'Can you recommend papers on transformer attention mechanisms from NeurIPS 2024?',
      'I scored 325 on my GRE examination with 168 in quantitative reasoning.',
      'We will cover topics 1, 2, and 3 during our initial 45-minute orientation.',
      'Please review the pull request on our repo branch feature/auth-v2.',
      'The placement department scheduled the campus drive for batch 2026 students.',
    ];

    legitimateMessages.forEach((msg, idx) => {
      it(`Clean Fixture #${idx + 1}: should NEVER falsely redact clean academic text: "${msg.slice(0, 40)}..."`, () => {
        const result = scanPrivacyShieldV2(msg);
        expect(result.hasPII).toBe(false);
        expect(result.cleanText).toBe(msg);
      });
    });
  });
});
