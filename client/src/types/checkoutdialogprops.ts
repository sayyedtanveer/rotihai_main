import { CategoryCart } from "./categorycart";

export interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CategoryCart | null;
  onClearCart?: () => void;
  onShowPaymentQR: ({
    orderId,
    amount,
    customerName,
    phone,
    email,
    address,
    accountCreated,
    defaultPassword,
  }: {
    orderId: string;
    amount: number;
    customerName: string;
    phone: string;
    email: string | undefined;
    address: string;
    accountCreated: boolean;
    defaultPassword?: string;
  }) => void;
}