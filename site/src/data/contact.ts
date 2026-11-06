/** Single source for public contact details. Empty strings are not rendered. */
export interface Contact {
  email: string;
  github: string;
  linkedin: string;
  portfolio: string;
  resume: string;
  formEndpoint: string;
}

export const contact: Contact = {
  // Awaiting the owner: do not fill these from git config or elsewhere.
  email: '',
  github: 'https://github.com/areimel',
  linkedin: '', // awaiting the owner
  portfolio: '', // awaiting the owner
  resume: '', // awaiting the owner
  formEndpoint: '', // awaiting the owner (e.g. a Formspree URL); form hidden while empty
};

/** Contact entries that have a value, in display order. */
export function visibleContacts(): { key: keyof Omit<Contact, 'formEndpoint'>; label: string; value: string }[] {
  const entries = [
    { key: 'email', label: 'Email', value: contact.email },
    { key: 'github', label: 'GitHub', value: contact.github },
    { key: 'linkedin', label: 'LinkedIn', value: contact.linkedin },
    { key: 'portfolio', label: 'Portfolio', value: contact.portfolio },
    { key: 'resume', label: 'Resume', value: contact.resume },
  ] as const;
  return entries.filter((e) => e.value !== '').map((e) => ({ ...e }));
}
