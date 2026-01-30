import { baseUrl } from "./axios";

  
  export const adaptProductSingleFromServer = (serverProduct: any): any => {

  
    const adptImg = () => {
        const images = serverProduct?.images?.map((item: string, index: number) => 
            (
                {
                    imageUrl: `${baseUrl}/${item || ''}`
                }
            )
        ) || [];
        
        
        return images;
    };
  
    return {
      ...serverProduct,
      images: adptImg(),
    };
  };
  
  export const adaptProductSingleObj = (serverProducts: any): any => {
    return adaptProductSingleFromServer(serverProducts)
  };