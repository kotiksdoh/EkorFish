export interface ProductGalleryItem {
  id: string;
  imageUrl: string;
}

export interface ProductDetailGalleryProps {
  items: ProductGalleryItem[];
  autoPlayInterval?: number;
  showIndicators?: boolean;
  /** false — без PagerView (безопасно при уходе с экрана на iOS) */
  isActive?: boolean;
}
