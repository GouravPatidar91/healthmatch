
import React from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  fallback = '/placeholder.svg',
  className,
  ...props
}) => {
  const [error, setError] = React.useState(false);
  
  const handleError = () => {
    setError(true);
  };

  return (
    <img
      src={error ? fallback : src}
      alt={alt}
      onError={handleError}
      className={className}
      {...props}
    />
  );
};
