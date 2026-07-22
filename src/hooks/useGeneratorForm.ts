import { useState, useEffect } from 'react';
import { generateUUID } from '../utils/common';

export const useGeneratorForm = (domains: string[]) => {
  const [formUUID, setFormUUID] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSecurity, setFormSecurity] = useState<'tls' | 'none'>('tls');
  const [formDomain, setFormDomain] = useState('');
  const [formBug, setFormBug] = useState('');
  const [formManualBug, setFormManualBug] = useState('');
  const [formWildcard, setFormWildcard] = useState(false);
  const [manualAlias, setManualAlias] = useState<string | null>(null);

  // Initialize UUIDs on mount
  useEffect(() => {
    setFormUUID(generateUUID());
    setFormPassword(generateUUID());
  }, []);

  // Set default domain when domains list is loaded or updated
  useEffect(() => {
    if (domains.length > 0 && (!formDomain || !domains.includes(formDomain))) {
      const randomBuffer = new Uint32Array(1);
      window.crypto.getRandomValues(randomBuffer);
      const randomIndex = randomBuffer[0] % domains.length;
      setFormDomain(domains[randomIndex]);
    }
  }, [domains, formDomain]);

  const resetFormValues = () => {
    setFormUUID(generateUUID());
    setFormPassword(generateUUID());
    setFormBug('');
    setFormManualBug('');
    setFormWildcard(false);
    setManualAlias(null);
  };

  return {
    formUUID,
    setFormUUID,
    formPassword,
    setFormPassword,
    formSecurity,
    setFormSecurity,
    formDomain,
    setFormDomain,
    formBug,
    setFormBug,
    formManualBug,
    setFormManualBug,
    formWildcard,
    setFormWildcard,
    manualAlias,
    setManualAlias,
    resetFormValues,
  };
};
