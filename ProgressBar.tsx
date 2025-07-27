import React from 'react';

interface ProgressBarProps {
  /** The current value of the progress bar. */
  value: number;
  /** The maximum value of the progress bar. */
  max?: number;
  /** An accessible label for the progress bar, read by screen readers. */
  label: string;
  /** A unique ID to link the label to the progress bar. */
  id: string;
}

/**
 * An accessible progress bar component that conveys progress both visually and
 * to assistive technologies. Includes a text percentage for colorblind users.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  id,
}) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div>
      <span id={`${id}-label`} className="sr-only">{label}</span>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          id={id}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby={`${id}-label`}
          className="bg-indigo-600 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ width: `${percentage}%` }}
        >
          {percentage.toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;