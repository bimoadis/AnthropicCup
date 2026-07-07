"use client";

import { useState } from "react";

interface CopyAddressProps {
  address?: string;
  className?: string;
  variant?: "default" | "footer" | "hero";
}

export default function CopyAddress({
  address = "JBmvSrET9pk21BFHvLnakQnWo64g11w1tCfUtDWYpump",
  className = "",
  variant = "default",
}: CopyAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address", err);
    }
  };

  const truncated = `${address.slice(0, 8)}...${address.slice(-8)}`;

  return (
    <div className={`ca-pill ${variant}-ca ${className}`}>
      <span className="ca-badge" title="Contract Address">
        {/* Blockchain Cube Icon */}
        <svg className="ca-badge-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </span>
      <span className="ca-address mono hide-mobile">{address}</span>
      <span className="ca-address mono show-mobile">{truncated}</span>
      <button
        onClick={handleCopy}
        className={`ca-copy ${copied ? "copied" : ""}`}
        title={copied ? "Copied!" : "Copy Contract Address"}
        aria-label="Copy Contract Address"
      >
        {copied ? (
          <svg className="ca-copy-icon tick" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg className="ca-copy-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}
