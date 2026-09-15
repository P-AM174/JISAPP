import { SITE_SOCIAL_PROFILES } from "@/lib/seo/site";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3.03 3.03 0 0 0-2.13-2.15C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.37.45A3.03 3.03 0 0 0 .5 6.2 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.8 3.03 3.03 0 0 0 2.13 2.15C4.5 20.4 12 20.4 12 20.4s7.5 0 9.37-.45a3.03 3.03 0 0 0 2.13-2.15A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.8ZM9.75 15.57V8.43L15.84 12l-6.09 3.57Z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M14.1 3h3.02c.28 2.46 1.86 4.13 4.28 4.32v3.08c-1.47-.05-2.86-.5-4.08-1.27v7.42c0 4.4-3.2 7.45-7.52 7.45C5.4 24 2.5 21.1 2.5 16.9c0-4.3 3.1-7.5 7.3-7.5.4 0 .8.03 1.18.1v3.24a4.2 4.2 0 0 0-1.18-.17c-2.18 0-3.82 1.76-3.82 4.2 0 2.4 1.7 4.2 4.08 4.2 2.3 0 3.86-1.64 3.86-4.28V3Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 7.2A4.8 4.8 0 1 0 16.8 12 4.8 4.8 0 0 0 12 7.2Zm0 7.92A3.12 3.12 0 1 1 15.12 12 3.12 3.12 0 0 1 12 15.12ZM17.94 6.96a1.12 1.12 0 1 1-1.12-1.12 1.12 1.12 0 0 1 1.12 1.12ZM21.6 7.2a5.52 5.52 0 0 0-1.5-3.9 5.52 5.52 0 0 0-3.9-1.5H7.8A5.52 5.52 0 0 0 3.9 3.3 5.52 5.52 0 0 0 2.4 7.2v8.4a5.52 5.52 0 0 0 1.5 3.9 5.52 5.52 0 0 0 3.9 1.5h8.4a5.52 5.52 0 0 0 3.9-1.5 5.52 5.52 0 0 0 1.5-3.9ZM20 15.72a3.84 3.84 0 0 1-1.04 2.72 3.84 3.84 0 0 1-2.72 1.04H7.76A3.84 3.84 0 0 1 5.04 18.44 3.84 3.84 0 0 1 4 15.72V7.76A3.84 3.84 0 0 1 5.04 5.04 3.84 3.84 0 0 1 7.76 4h8.48A3.84 3.84 0 0 1 18.96 5.04 3.84 3.84 0 0 1 20 7.76Z" />
    </svg>
  );
}

const ICONS = {
  X: XIcon,
  YouTube: YouTubeIcon,
  TikTok: TikTokIcon,
  Instagram: InstagramIcon,
} as const;

export function OfficialSocialLinks({
  className = "",
}: {
  className?: string;
}) {
  return (
    <nav aria-label="公式SNS" className={`flex items-center gap-2 ${className}`}>
      {SITE_SOCIAL_PROFILES.map((profile) => {
        const Icon = ICONS[profile.name];
        return (
          <a
            key={profile.url}
            href={profile.url}
            target="_blank"
            rel="me noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            aria-label={`${profile.name} ${profile.handle}`}
            title={`${profile.name} ${profile.handle}`}
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </nav>
  );
}
