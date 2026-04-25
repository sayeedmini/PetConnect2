import { useState } from "react"; // Import hook to manage the error state

/**
 * ImageWithFallback Component
 * Automatically renders a placeholder if the original image URL fails to load
 */
function ImageWithFallback({ src, alt, className = "", ...rest }) {
  const [hasError, setHasError] = useState(false); // Track if the image load failed

  // If there is no source URL or an error occurred during loading
  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}
        {...rest}
      >
        {/* Placeholder text shown instead of a broken icon */}
        No Image
      </div>
    );
  }

  // Standard img tag with an error handler attached
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)} // Triggers when the browser cannot load the image
      {...rest}
    />
  );
}

export default ImageWithFallback;
