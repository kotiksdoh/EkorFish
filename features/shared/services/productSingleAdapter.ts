import { baseUrl } from "./axios";

  
  export const adaptProductSingleFromServer = (serverProduct: any): any => {
    const firstImagePath = serverProduct?.images?.[0] || "";
    const image = firstImagePath
      ? `${baseUrl}/${String(firstImagePath).replace(/^\//, "")}`
      : "";

    const adptImg = () => {
        const images = serverProduct?.images?.map((item: string) => 
            (
                {
                    imageUrl: `${baseUrl}/${String(item || "").replace(/^\//, "")}`
                }
            )
        ) || [];
        
        
        return images;
    };
  
    return {
      ...serverProduct,
      image,
      images: adptImg(),
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

    return {
      id: productData.id,
      name: productData.name ?? "",
      image: imageUrl,
      images: imageUrl ? [{ imageUrl }] : [],
      purchaseOptions: productData.purchaseOptions ?? [],
      isFavorite: productData.isFavorite,
      measureType: productData.measureType,
      dateFrom: productData.dateFrom,
      dateTo: productData.dateTo,
      stocks: productData.stocks,
    };
  };