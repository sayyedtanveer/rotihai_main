import { Facebook, Instagram, Twitter, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Footer() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userToken = localStorage.getItem("userToken");
  const isAuthenticated = !!(user || userToken);
  const [email, setEmail] = useState("");

  const handleProfileClick = () => {
    if (isAuthenticated) {
      setLocation("/profile");
    } else {
      toast({
        title: "Login Required",
        description: "Please login to view your profile",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppSupport = () => {
    const message = "Hi! I need help with my order from RotiHai.";
    const whatsappUrl = `https://wa.me/918169020290?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      toast({
        title: data.success ? "✅ Subscribed!" : "Error",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      if (data.success) setEmail("");
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-card border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-primary mb-4" data-testid="text-footer-logo">
              RotiHai
            </h3>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-footer-description">
              Delicious meals delivered to your doorstep in 30 minutes or less.
            </p>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" data-testid="button-facebook">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" data-testid="button-instagram">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" data-testid="button-twitter">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                data-testid="button-whatsapp"
                onClick={handleWhatsAppSupport}
                className="text-green-600 hover:text-green-700"
                title="Chat with us on WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* <div>
            <h4 className="font-semibold mb-4" data-testid="text-categories-title">Categories</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="link-rotis">Rotis & Breads</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="link-meals">Lunch & Dinner</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="link-hotels">Hotel Specials</a></li>
            </ul>
          </div> */}

          <div>
            <h4 className="font-semibold mb-4" data-testid="text-support-title">Account & Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button
                  onClick={handleProfileClick}
                  className="hover:text-primary transition-colors flex items-center gap-2 w-full text-left"
                  data-testid="link-profile"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </button>
              </li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="link-help">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="link-track">Track Order</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="link-contact">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="link-faq">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4" data-testid="text-newsletter-title">Stay Updated</h4>
            <p className="text-sm text-muted-foreground mb-3" data-testid="text-newsletter-description">
              Get special offers and updates
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                data-testid="input-newsletter"
              />
              <Button onClick={handleSubscribe} disabled={subscribing} data-testid="button-subscribe">
                {subscribing ? "..." : "Subscribe"}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p data-testid="text-copyright">
            © 2025 RotiHai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
