import React from 'react';

interface StickerArtProps {
  stickerId: string;
  locked?: boolean;
  size?: number;
}

export const StickerArt: React.FC<StickerArtProps> = ({
  stickerId,
  locked = false,
  size = 112,
}) => {
  const filterClass = locked ? 'grayscale opacity-35 contrast-75' : 'die-cut-sticker';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={filterClass}
      aria-hidden="true"
    >
      {/* Die-cut white sticker backing */}
      <circle cx="60" cy="60" r="54" fill="#FFFFFF" stroke="#E7DCCB" strokeWidth="1.5" />

      {stickerId === 'multani-pottery' && (
        <g>
          <circle cx="60" cy="60" r="46" fill="#EFF6FF" />
          {/* Vase Silhouette */}
          <path
            d="M48 22 L72 22 L68 35 C82 44 86 64 78 83 C74 92 67 98 60 98 C53 98 46 92 42 83 C34 64 38 44 52 35 Z"
            fill="#1D4ED8"
            stroke="#1E293B"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <ellipse cx="60" cy="22" rx="13" ry="4" fill="#93C5FD" stroke="#1E293B" strokeWidth="2" />
          {/* Kashigari Floral Band */}
          <path d="M40 58 Q60 66 80 58" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M42 74 Q60 82 78 74" fill="none" stroke="#38BDF8" strokeWidth="2.5" />
          <circle cx="60" cy="54" r="7" fill="#FFFFFF" />
          <circle cx="60" cy="54" r="3.5" fill="#0284C7" />
          <circle cx="47" cy="66" r="4" fill="#BAE6FD" />
          <circle cx="73" cy="66" r="4" fill="#BAE6FD" />
          <path d="M55 34 Q60 39 65 34" fill="none" stroke="#E0F2FE" strokeWidth="2" />
        </g>
      )}

      {stickerId === 'ajrak-swatch' && (
        <g transform="rotate(-6 60 60)">
          <rect
            x="22"
            y="24"
            width="76"
            height="72"
            rx="6"
            fill="#991B1B"
            stroke="#2C1B12"
            strokeWidth="2.5"
          />
          <rect x="28" y="30" width="64" height="60" fill="none" stroke="#FEF3C7" strokeWidth="2" strokeDasharray="4 3" />
          <rect x="35" y="37" width="50" height="46" fill="#1E3A8A" stroke="#FEF3C7" strokeWidth="1.8" />
          {/* Block-print Ajrak Star */}
          <polygon
            points="60,41 66,54 79,60 66,66 60,79 54,66 41,60 54,54"
            fill="#FEF3C7"
            stroke="#2C1B12"
            strokeWidth="1.4"
          />
          <circle cx="60" cy="60" r="5" fill="#DC2626" />
          <circle cx="41" cy="43" r="2.5" fill="#FEF3C7" />
          <circle cx="79" cy="43" r="2.5" fill="#FEF3C7" />
          <circle cx="41" cy="77" r="2.5" fill="#FEF3C7" />
          <circle cx="79" cy="77" r="2.5" fill="#FEF3C7" />
        </g>
      )}

      {stickerId === 'brass-degchi' && (
        <g>
          <circle cx="60" cy="60" r="46" fill="#FFFBEB" />
          {/* Degchi Body */}
          <path
            d="M31 52 L89 52 L85 80 C83 90 73 95 60 95 C47 95 37 90 35 80 Z"
            fill="#D97706"
            stroke="#2C1B12"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Rim */}
          <rect x="26" y="47" width="68" height="7" rx="3.5" fill="#F59E0B" stroke="#2C1B12" strokeWidth="2.2" />
          {/* Lid */}
          <path
            d="M32 47 C36 35 48 31 60 31 C72 31 84 35 88 47 Z"
            fill="#FBBF24"
            stroke="#2C1B12"
            strokeWidth="2.2"
          />
          {/* Lid Knob */}
          <circle cx="60" cy="27" r="5" fill="#B45309" stroke="#2C1B12" strokeWidth="2" />
          {/* Hammered highlights */}
          <ellipse cx="47" cy="67" rx="5" ry="3" fill="#FDE68A" opacity="0.65" />
          <ellipse cx="62" cy="76" rx="6" ry="3.5" fill="#FDE68A" opacity="0.55" />
          <ellipse cx="75" cy="65" rx="4" ry="2.5" fill="#FDE68A" opacity="0.65" />
          {/* Handles */}
          <path d="M27 56 C20 56 20 66 28 66" fill="none" stroke="#2C1B12" strokeWidth="2.5" />
          <path d="M93 56 C100 56 100 66 92 66" fill="none" stroke="#2C1B12" strokeWidth="2.5" />
        </g>
      )}

      {stickerId === 'truck-art-phool' && (
        <g>
          <circle cx="60" cy="60" r="46" fill="#0F766E" stroke="#2C1B12" strokeWidth="2.5" />
          {/* Outer chamakpatti scalloped petals */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx="60"
              cy="30"
              rx="9"
              ry="14"
              fill={deg % 90 === 0 ? '#F59E0B' : '#EC4899'}
              stroke="#2C1B12"
              strokeWidth="2"
              transform={`rotate(${deg} 60 60)`}
            />
          ))}
          <circle cx="60" cy="60" r="22" fill="#FEF08A" stroke="#2C1B12" strokeWidth="2.2" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <circle
              key={deg}
              cx="60"
              cy="46"
              r="4.5"
              fill="#DC2626"
              stroke="#2C1B12"
              strokeWidth="1.2"
              transform={`rotate(${deg} 60 60)`}
            />
          ))}
          <circle cx="60" cy="60" r="9" fill="#0EA5E9" stroke="#2C1B12" strokeWidth="2" />
          <circle cx="60" cy="60" r="3.5" fill="#FFFFFF" />
        </g>
      )}

      {stickerId === 'clay-matka' && (
        <g>
          <circle cx="60" cy="60" r="46" fill="#FEF3C7" />
          {/* Terracotta Matka Body */}
          <path
            d="M47 32 L73 32 L70 40 C86 48 90 68 82 85 C77 95 69 98 60 98 C51 98 43 95 38 85 C30 68 34 48 50 40 Z"
            fill="#C2592A"
            stroke="#2C1B12"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <ellipse cx="60" cy="31" rx="15" ry="4.5" fill="#9A3412" stroke="#2C1B12" strokeWidth="2.2" />
          {/* Folk painted white & ochre band */}
          <path d="M36 62 Q60 70 84 62" fill="none" stroke="#FFFBEB" strokeWidth="3" />
          <path d="M36 68 L44 62 L52 70 L60 62 L68 70 L76 62 L84 68" fill="none" stroke="#FBBF24" strokeWidth="2.2" />
          <circle cx="48" cy="52" r="2.5" fill="#FFFBEB" />
          <circle cx="60" cy="54" r="2.5" fill="#FFFBEB" />
          <circle cx="72" cy="52" r="2.5" fill="#FFFBEB" />
        </g>
      )}

      {stickerId === 'embroidered-khussa' && (
        <g transform="rotate(-8 60 60)">
          <circle cx="60" cy="60" r="46" fill="#FDF2F8" />
          {/* Curved-toe Lahori Khussa */}
          <path
            d="M24 68 C24 58 34 52 46 56 C55 60 66 56 76 47 C84 39 92 31 97 26 C95 45 91 66 78 78 C64 88 38 88 26 78 C23 75 23 71 24 68 Z"
            fill="#881337"
            stroke="#2C1B12"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner cream lining */}
          <path
            d="M31 64 C39 58 51 64 62 61 C54 69 40 70 31 64 Z"
            fill="#FEF3C7"
            stroke="#2C1B12"
            strokeWidth="1.5"
          />
          {/* Golden Tilla Embroidery */}
          <path d="M36 74 Q58 80 79 65" fill="none" stroke="#FBBF24" strokeWidth="2.6" strokeDasharray="3 2" />
          <circle cx="52" cy="73" r="3" fill="#FDE047" />
          <circle cx="65" cy="70" r="3" fill="#FDE047" />
          <circle cx="77" cy="62" r="2.5" fill="#FDE047" />
          <circle cx="88" cy="46" r="2.5" fill="#FDE047" />
        </g>
      )}
    </svg>
  );
};
