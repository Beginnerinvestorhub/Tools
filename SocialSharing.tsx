import { useState } from 'react';

/**
 * An accessible social sharing component with clear button labels and
 * live feedback for clipboard actions.
 */
export function SocialSharing() {
  const [copied, setCopied] = useState(false);
  const shareUrl = 'https://beginnerinvestorhub.com';
  const shareText = 'I just unlocked a new achievement on Beginner Investor Hub!';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // You could show an error notification here
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Twitter"
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
      >
        {/* SVG for Twitter Icon */}
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">...</svg>
      </a>
      <button
        onClick={handleCopy}
        aria-label="Copy link to clipboard"
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
      >
        {/* SVG for Copy Icon */}
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">...</svg>
      </button>

      {/* Live region for screen reader feedback */}
      <div aria-live="polite" className="sr-only">
        {copied && 'Link copied to clipboard!'}
      </div>
    </div>
  );
}