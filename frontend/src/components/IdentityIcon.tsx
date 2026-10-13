import type { SignatureIdentity } from "../identities";

interface IdentityIconProps {
  identity: SignatureIdentity;
  size?: number;
  className?: string;
}

export function IdentityIcon({
  identity,
  size = 24,
  className = "",
}: IdentityIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`identity-icon ${className}`}
      style={{ color: identity.accentColor }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: identity.svgPath }}
    />
  );
}
