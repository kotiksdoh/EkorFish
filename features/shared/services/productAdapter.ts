import { baseUrl } from "./axios";

interface ServerProduct {
    id: string;
    name: string;
    purchaseOptions: Array<{
      id: string;
      code: string;
      name: string;
      price: number;
      minQuantity: number;
      maxQuantity: number;
      step: number;
    }>;
    measureType: string;
    dateFrom: string;
    dateTo: string;
    isFavorite: boolean;
    images: string[];
  }
  
  interface AdaptedProduct {
    id: string | number; 
    name: string;
    price: number;
    pricePerKg: number;
    image: string;
    isFrozen: boolean;
    country?: string;
    cut?: string;
    grade?: string;
    originalProduct?: Partial<ServerProduct>;
    purchaseOptions?: Array<any>;
    measureType?: string;
    dateFrom?: string;
    dateTo?: string;
    isFavorite?: boolean;
  }
  
  export const adaptProductFromServer = (serverProduct: ServerProduct): AdaptedProduct => {
    let packageOption = serverProduct.purchaseOptions.find(opt => opt.code === "package");
    if (!packageOption && serverProduct.purchaseOptions.length > 0) {
      packageOption = serverProduct.purchaseOptions[0];
    }
  
    const pricePerKg = packageOption?.price || 0;
    const price = pricePerKg * (packageOption?.step || 1);
  
    const image = `${baseUrl}/${serverProduct.images?.[0]|| ''}` 
  
    return {
      id: serverProduct.id, 
      name: serverProduct.name,
      price: price, 
      pricePerKg: pricePerKg,
      image: image,
      isFrozen: true, 
      originalProduct: serverProduct,
      purchaseOptions: serverProduct.purchaseOptions,
      measureType: serverProduct.measureType,
      dateFrom: serverProduct.dateFrom,
      dateTo: serverProduct.dateTo,
      isFavorite: serverProduct.isFavorite,
    };
  };
  
  export const adaptProductsArray = (serverProducts: ServerProduct[]): AdaptedProduct[] => {
    return serverProducts.map(adaptProductFromServer);
  };