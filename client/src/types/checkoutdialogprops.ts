import { CategoryCart } from "./categorycart";

export interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CategoryCart | null;
  initialData?: any;
  onClearCart?: () => void;
  onShowPaymentQR: (data: {
    orderData?: any;
    orderId?: string;
    amount: number;
    customerName: string;
    phone: string;
    email: string | undefined;
    address: string;
    pendingCheckoutId: string | null;
  }) => void;
}