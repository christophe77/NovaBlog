import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { SocialIcon } from './SocialIcons';

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .getPublicSettings()
      .then((data) => {
        if (data.settings) {
          const social: Record<string, string> = {};
          if (data.settings['social.facebook']) social.facebook = data.settings['social.facebook'];
          if (data.settings['social.instagram']) social.instagram = data.settings['social.instagram'];
          if (data.settings['social.tiktok']) social.tiktok = data.settings['social.tiktok'];
          if (data.settings['social.linkedin']) social.linkedin = data.settings['social.linkedin'];
          if (data.settings['social.twitter']) social.twitter = data.settings['social.twitter'];
          if (data.settings['social.reddit']) social.reddit = data.settings['social.reddit'];
          setSocialLinks(social);
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, []);

  const hasSocialLinks = Object.keys(socialLinks).length > 0;

  return (
    <footer style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--spacing-xl) 0', marginTop: 'var(--spacing-2xl)' }}>
      <div className="container">
        {hasSocialLinks && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            {socialLinks.facebook && <SocialIcon name="facebook" url={socialLinks.facebook} />}
            {socialLinks.instagram && <SocialIcon name="instagram" url={socialLinks.instagram} />}
            {socialLinks.tiktok && <SocialIcon name="tiktok" url={socialLinks.tiktok} />}
            {socialLinks.linkedin && <SocialIcon name="linkedin" url={socialLinks.linkedin} />}
            {socialLinks.twitter && <SocialIcon name="twitter" url={socialLinks.twitter} />}
            {socialLinks.reddit && <SocialIcon name="reddit" url={socialLinks.reddit} />}
          </div>
        )}
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <p>&copy; {new Date().getFullYear()} InnovLayer. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

