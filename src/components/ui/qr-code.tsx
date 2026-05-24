"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeImageProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCodeImage({ url, size = 128, className }: QRCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setDataUrl).catch(console.error);
  }, [url, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-white/10 animate-pulse rounded"
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      width={size}
      height={size}
      className={className}
    />
  );
}
