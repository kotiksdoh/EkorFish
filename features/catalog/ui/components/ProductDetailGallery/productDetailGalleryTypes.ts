export interface ProductGalleryItem {
  id: string;
  imageUrl: string;
}

export interface ProductDetailGalleryProps {
  items: ProductGalleryItem[];
  autoPlayInterval?: number;
  showIndicators?: boolean;
}
