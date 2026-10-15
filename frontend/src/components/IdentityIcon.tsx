import { useState } from "react";
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
  const [imgError, setImgError] = useState(false);

  if (identity.imageUrl && !imgError) {
    return (
      <img
        src={identity.imageUrl}
        alt={identity.name}
        width={size}
        height={size}
        className={`identity-icon identity-icon-img ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          objectFit: "cover",
          display: "block",
        }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`identity-icon ${className}`}
      style={{ color: identity.accentColor }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: identity.svgPath || "" }}
    />
  );
}
