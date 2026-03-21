import { CategoryCart } from "./categorycart";

export interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CategoryCart | null;
  onClearCart?: () => void;
  onShowPaymentQR: ({
    orderData,
    amount,
    customerName,
    phone,
    email,
    address,
    pendingCheckoutId,
  }: {
    orderData: any;
    amount: number;
    customerName: string;
    phone: string;
    email: string | undefined;
    address: string;
    pendingCheckoutId: string | null;
  }) => void;
}