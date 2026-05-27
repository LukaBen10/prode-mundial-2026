interface FlagIconProps {
  code: string;
  alt?: string;
  size?: 'sm' | 'md';
  className?: string;
}

// Usa flagcdn.com — funciona en todos los navegadores/SO (no depende de emoji font)
export default function FlagIcon({ code, alt = '', size = 'sm', className = '' }: FlagIconProps) {
  const w = size === 'md' ? 24 : 20;
  const h = size === 'md' ? 18 : 15;
  const cdnW = size === 'md' ? 40 : 20;

  return (
    <img
      src={`https://flagcdn.com/w${cdnW}/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w${cdnW * 2}/${code.toLowerCase()}.png 2x`}
      width={w}
      height={h}
      alt={alt}
      className={`inline-block rounded-sm align-middle ${className}`}
      style={{ objectFit: 'cover' }}
      loading="eager"
    />
  );
}
