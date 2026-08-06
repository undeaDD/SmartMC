import { Image, type ImageProps } from 'expo-image';
import { memo, useState } from 'react';

type ImageWrapperProps = ImageProps & {
  fallbackSource?: ImageProps['source'];
};

function ImageWrapperComponent({ source, fallbackSource, onError, ...props }: ImageWrapperProps) {
  const [error, setError] = useState(false);

  return (
    <Image
      source={error && fallbackSource ? fallbackSource : source}
      cachePolicy="disk"
      onError={(event) => {
        setError(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}

export const ImageWrapper = memo(ImageWrapperComponent);
