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