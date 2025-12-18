
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { PromotionalBanner } from "@shared/schema";

interface PromotionalBannersSectionProps {
  onSubscriptionClick: () => void;
  onCategoryClick: (categoryId: string) => void;
}

export default function PromotionalBannersSection({
  onSubscriptionClick,
  onCategoryClick,
}: PromotionalBannersSectionProps) {
  const { data: banners = [] } = useQuery<PromotionalBanner[]>({
    queryKey: ["/api/promotional-banners"],
  });

  // Map Tailwind colors to actual hex values
  const colorMap: Record<string, string> = {
    "orange-600": "#ea580c",
    "amber-600": "#b45309",
    "yellow-600": "#ca8a04",
    "red-600": "#dc2626",
    "rose-600": "#e11d48",
    "pink-600": "#db2777",
    "blue-600": "#2563eb",
    "cyan-600": "#0891b2",
    "teal-600": "#0d9488",
    "purple-600": "#9333ea",
    "violet-600": "#7c3aed",
    "indigo-600": "#4f46e5",
    "green-600": "#16a34a",
    "emerald-600": "#059669",
  };

  if (banners.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-3 py-4 space-y-4">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className="relative overflow-hidden rounded-2xl p-4 sm:p-6"
          style={{
            background: `linear-gradient(to right, ${colorMap[banner.gradientFrom] || "#ea580c"}, ${colorMap[banner.gradientVia] || "#b45309"}, ${colorMap[banner.gradientTo] || "#ca8a04"})`,
          }}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-4 text-6xl">{banner.emoji1}</div>
            <div className="absolute bottom-2 right-8 text-5xl">{banner.emoji2}</div>
            <div className="absolute top-1/2 right-1/4 text-4xl">{banner.emoji3}</div>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {banner.title}
              </h3>
              <p className="text-sm text-white/80">{banner.subtitle}</p>
            </div>
            <Button
              onClick={() => {
                if (banner.actionType === "subscription") {
                  onSubscriptionClick();
                } else if (banner.actionType === "category" && banner.actionValue) {
                  onCategoryClick(banner.actionValue);
                } else if (banner.actionType === "url" && banner.actionValue) {
                  window.open(banner.actionValue, "_blank");
                }
              }}
              className="bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-lg"
            >
              {banner.buttonText}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}
