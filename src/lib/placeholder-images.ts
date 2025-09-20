export interface ImagePlaceholder {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
}

// Generate image data from the images folder filenames
export const imageFiles = [
  'cat.png',
  'cow.png',
  'crocodile.png',
  'dog.png',
  'horse.png',
  'giraffe.png',
  'lion.png',
  'monkey.png',
  'mouse.png',
  'parrot.png',
  'rabbit.png',
  'sheep.png',
  'tiger.png'
];

export const PlaceHolderImages: ImagePlaceholder[] = imageFiles.map((filename, index) => {
  const nameWithoutExtension = filename.replace('.png', '');
  
  return {
    id: (index + 1).toString(),
    description: nameWithoutExtension, // Keep original filename without .png, no capitalization
    imageUrl: `/images/${filename}`,
    imageHint: `${nameWithoutExtension} drawing`
  };
});
