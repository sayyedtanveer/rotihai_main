
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CalendarDays, Zap } from "lucide-react";
import type { SubscriptionPlan } from "@shared/schema";

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  onSubscribe: (planId: string) => void;
  isSubscribed?: boolean;
}

const DAY_SHORT: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

const FREQUENCY_LABEL: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly",
};

export function SubscriptionCard({ plan, onSubscribe, isSubscribed }: SubscriptionCardProps) {
  const deliveryDays = plan.deliveryDays as string[];

  return (
    <div
      className={`relative rounded-xl border bg-white dark:bg-slate-900 shadow-sm flex flex-col overflow-hidden transition-all duration-200 active:scale-[0.98] ${
        isSubscribed
          ? "border-emerald-300 dark:border-emerald-700"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      {/* Subscribed ribbon */}
      {isSubscribed && (
        <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-semibold rounded-bl-lg">
          ✓ Subscribed
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Plan name + frequency badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {plan.name}
          </h3>
          <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {FREQUENCY_LABEL[plan.frequency] ?? plan.frequency}
          </span>
        </div>

        {/* Description */}
        {plan.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {plan.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            ₹{plan.price}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            /{plan.frequency === "daily" ? "mo" : plan.frequency === "weekly" ? "wk" : "mo"}
          </span>
        </div>

        {/* Delivery days */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <CalendarDays className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Delivery days</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {deliveryDays.map(day => (
              <span
                key={day}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {DAY_SHORT[day] ?? day}
              </span>
            ))}
          </div>
        </div>

        {/* Feature highlights */}
        <ul className="space-y-1">
          {[
            "Fresh daily delivery",
            "Pause & resume anytime",
            "Quality guaranteed",
          ].map(feature => (
            <li key={feature} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <Button
          className={`w-full h-10 text-sm font-semibold rounded-lg transition-all ${
            isSubscribed
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white"
          }`}
          onClick={() => onSubscribe(plan.id)}
          disabled={isSubscribed || !plan.isActive}
        >
          {isSubscribed ? (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              Subscribed
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-1.5" />
              Subscribe · ₹{plan.price}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
