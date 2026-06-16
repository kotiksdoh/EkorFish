import {
  buildProductImageUrl,
  normalizeProductImages,
} from "./productImageUrl";

  
  export const adaptProductSingleFromServer = (serverProduct: any): any => {
    const images = normalizeProductImages(serverProduct?.images);
    const image = images[0]?.imageUrl ?? "";
  
    return {
      ...serverProduct,
      image,
      images,
      purchaseOptions: Array.isArray(serverProduct?.purchaseOptions)
        ? serverProduct.purchaseOptions
        : [],
      stocks: Array.isArray(serverProduct?.stocks) ? serverProduct.stocks : [],
      filterOptions: Array.isArray(serverProduct?.filterOptions)
        ? serverProduct.filterOptions
        : [],
    };
  };
  
  export const adaptProductSingleObj = (serverProducts: any): any => {
    return adaptProductSingleFromServer(serverProducts)
  };

  /** Данные карточки списка → превью для экрана товара до ответа API */
  export const buildProductPreviewFromList = (productData: any): any | null => {
    if (!productData?.id) return null;

    const raw = productData.originalProduct;
    if (raw?.id) {
      return adaptProductSingleObj(raw);
    }

    const imageUrl =
      typeof productData.image === "string" ? productData.image : "";

    const previewImages = normalizeProductImages(
      imageUrl ? [imageUrl] : productData.images,
    );

    return {
      id: productData.id,
      name: productData.name ?? "",
      image: previewImages[0]?.imageUrl ?? "",
      images: previewImages,
      purchaseOptions: Array.isArray(productData.purchaseOptions)
        ? productData.purchaseOptions
        : [],
      isFavorite: productData.isFavorite,
      measureType: productData.measureType,
      dateFrom: productData.dateFrom,
      dateTo: productData.dateTo,
      stocks: Array.isArray(productData.stocks) ? productData.stocks : [],
    };
  };