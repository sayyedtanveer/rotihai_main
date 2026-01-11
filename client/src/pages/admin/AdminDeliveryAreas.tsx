import { AdminLayout } from "@/components/admin/AdminLayout";
import { DeliveryAreasManagement } from "./DeliveryAreasManagement";
import { MapPin } from "lucide-react";

export default function AdminDeliveryAreas() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="w-8 h-8" />
            Delivery Areas
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Configure delivery areas for your service. Customers can only order from configured areas.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <DeliveryAreasManagement />
        </div>
      </div>
    </AdminLayout>
  );
}
