import { AddToCart } from "@/features/catalog/catalogSlice";
import { buildTemplateLineFromProduct } from "@/features/templates/buildTemplateLine";
import { useTemplatePicker } from "@/features/templates/TemplatePickerContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCallback, useState } from "react";

type AddToCartVariant = "cart" | "template";

type UseTemplateAwareAddToCartResult = {
  selectedProduct: any;
  existingCartItem: any;
  showAddToCartModal: boolean;
  handleAddToCartPress: (product: any) => void;
  handleAddToCart: (productId: string, optionId: string, quantity: number) => void;
  closeAddToCartModal: () => void;
  variant: AddToCartVariant;
};

export function useTemplateAwareAddToCart(): UseTemplateAwareAddToCartResult {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.catalog.cart);
  const templatePicker = useTemplatePicker();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [existingCartItem, setExistingCartItem] = useState<any>(null);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);

  const isTemplatePick = !!templatePicker.pickingForTemplateId;
  const variant: AddToCartVariant = isTemplatePick ? "template" : "cart";

  const handleAddToCartPress = useCallback(
    (product: any) => {
      const cartItemsForProduct =
        cartItems?.filter((item: any) => item.productId === product.id) || [];
      const templateLines = isTemplatePick
        ? templatePicker.getExistingTemplateLinesForProduct(String(product.id))
        : [];

      setSelectedProduct(product);
      setExistingCartItem(isTemplatePick ? templateLines : cartItemsForProduct);
      setShowAddToCartModal(true);
    },
    [cartItems, isTemplatePick, templatePicker],
  );

  const handleAddToCart = useCallback(
    (productId: string, optionId: string, quantity: number) => {
      if (isTemplatePick && selectedProduct) {
        void templatePicker.addLineFromProduct(
          buildTemplateLineFromProduct(selectedProduct, optionId, quantity),
        );
        return;
      }

      dispatch(
        AddToCart({
          productId,
          productPurchaseOptionId: optionId,
          quantity,
        }),
      );
    },
    [dispatch, isTemplatePick, selectedProduct, templatePicker],
  );

  const closeAddToCartModal = useCallback(() => {
    setShowAddToCartModal(false);
    setExistingCartItem(null);
    setSelectedProduct(null);
  }, []);

  return {
    selectedProduct,
    existingCartItem,
    showAddToCartModal,
    handleAddToCartPress,
    handleAddToCart,
    closeAddToCartModal,
    variant,
  };
}
