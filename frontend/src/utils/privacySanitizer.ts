/**
 * Scrizians Anti-Bypass & Privacy Sanitizer Utility
 * Sanitizes and redacts personal contact info (emails, phone numbers, WhatsApp links, direct URLs)
 * from public talent profiles, portfolios, and community posts to protect talent privacy
 * and prevent off-platform contract bypassing.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/g;
const SOCIAL_URL_REGEX = /(https?:\/\/)?(www\.)?(linkedin\.com|github\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|wa\.me)\/[^\s]+/gi;

export interface SanitizedTalentProfile {
  scrizianId: string;
  name: string;
  title: string;
  skills: string[];
  hourlyRateUSD: string | number;
  availability: string;
  verifiedStatus: string;
  bio?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export const sanitizePublicText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(EMAIL_REGEX, '[Email Protected — Contact via Scrizians Desk]')
    .replace(SOCIAL_URL_REGEX, '[Direct Link Redacted — Scrizian ID Verified Profile]')
    .replace(PHONE_REGEX, (match) => {
      // Preserve standard short digits or dates like "2026", "10-15 years"
      if (match.trim().length < 8) return match;
      return '[Phone Number Redacted]';
    });
};

export const projectPublicTalentProfile = (talent: any, isAuthorizedClient: boolean = false): SanitizedTalentProfile => {
  if (!talent) return talent;

  const publicProfile: SanitizedTalentProfile = {
    scrizianId: talent.scrizianId || talent.id || 'SZN-DEV-1001',
    name: talent.displayName || talent.name || 'Scrizian Talent Member',
    title: talent.title || 'Senior Software Engineer',
    skills: Array.isArray(talent.skills) ? talent.skills : (talent.skills ? talent.skills.split(',') : []),
    hourlyRateUSD: talent.hourlyRateUSD || talent.rate || '35',
    availability: talent.availability || 'Immediate',
    verifiedStatus: talent.status || talent.verifiedStatus || 'Verified Scrizian',
    bio: sanitizePublicText(talent.bio || talent.about || '')
  };

  // Only attach direct contact info if viewed by an authenticated Scriza Client / Admin
  if (isAuthorizedClient) {
    publicProfile.email = talent.email;
    publicProfile.phone = talent.phone;
    publicProfile.linkedinUrl = talent.linkedinUrl;
    publicProfile.githubUrl = talent.githubUrl;
  }

  return publicProfile;
};
