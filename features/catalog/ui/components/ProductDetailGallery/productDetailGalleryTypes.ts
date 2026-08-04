export interface ProductGalleryItem {
  id: string;
  imageUrl: string;
}

export interface ProductDetailGalleryProps {
  items: ProductGalleryItem[];
  autoPlayInterval?: number;
  showIndicators?: boolean;
  /** false — статичный слайд без карусели (безопасно при уходе с экрана) */
  isActive?: boolean;
}
