import { useEffect, useState } from 'react';
import Fingerprint2 from 'fingerprintjs2';

interface FingerprintData {
  hash: string;
  components: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    language: string;
    platform: string;
  };
}

export const useFingerprint = () => {
  const [fingerprint, setFingerprint] = useState<FingerprintData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        // Attendre que le DOM soit complètement chargé
        if (document.readyState === 'loading') {
          await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
          });
        }

        // Générer l'empreinte
        Fingerprint2.get((components) => {
          const values = components.map(component => component.value);
          const murmur = Fingerprint2.x64hash128(values.join(''), 31);
          
          const fingerprintData: FingerprintData = {
            hash: murmur,
            components: {
              userAgent: navigator.userAgent,
              screenResolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              language: navigator.language,
              platform: navigator.platform
            }
          };

          setFingerprint(fingerprintData);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error generating fingerprint:', error);
        setLoading(false);
      }
    };

    generateFingerprint();
  }, []);

  return { fingerprint, loading };
};
