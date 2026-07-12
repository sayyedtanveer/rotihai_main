/**
 * FAQ Schema Generator for RotiHai SEO
 *
 * Generates FAQ question-answer pairs from business rules and context data.
 * Produces JSON-LD FAQPage structured data for search engine rich results.
 */

import { JsonLdSchema } from './generateSeoMetadata';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqContext {
  deliveryAreas?: string[];
  paymentMethods?: string[];
  subscriptionPlans?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCHEMA_CONTEXT = 'https://schema.org';

// ─── FAQ Generator ────────────────────────────────────────────────────────────

/**
 * Generates FAQ pairs from business rules and provided context data.
 * Returns a minimum of 5 FAQ items covering delivery, ordering, payments,
 * subscriptions, and food quality.
 */
export function generateFaqs(context: FaqContext): FaqItem[] {
  const deliveryAreas =
    context.deliveryAreas && context.deliveryAreas.length > 0
      ? context.deliveryAreas.join(', ')
      : 'Mumbai neighborhoods';

  const paymentMethods =
    context.paymentMethods && context.paymentMethods.length > 0
      ? context.paymentMethods.join(', ')
      : 'UPI, QR code payments';

  const subscriptionInfo =
    context.subscriptionPlans && context.subscriptionPlans.length > 0
      ? `We offer ${context.subscriptionPlans.join(', ')} subscription plans.`
      : 'We offer daily and weekly subscription plans.';

  const faqs: FaqItem[] = [
    {
      question: 'How does food delivery work on RotiHai?',
      answer:
        'RotiHai connects you with verified home chefs in your area. Browse menus, place your order, and get fresh homemade food delivered to your doorstep. Each meal is prepared by skilled home chefs who specialize in authentic homemade cuisine.',
    },
    {
      question: 'What areas does RotiHai deliver to?',
      answer: `RotiHai currently delivers to ${deliveryAreas}. We are continuously expanding our delivery network to serve more locations.`,
    },
    {
      question: 'How do subscription plans work?',
      answer: `${subscriptionInfo} Subscribe to get regular homemade meals delivered on your chosen days. You can customize your meal preferences and delivery schedule.`,
    },
    {
      question: 'Can I pause or cancel my subscription?',
      answer:
        'Yes, you can pause or cancel your subscription anytime from the app. Changes take effect from the next delivery cycle. No cancellation fees apply.',
    },
    {
      question: 'How is the food prepared?',
      answer:
        'All food on RotiHai is homemade by verified home chefs. Our chefs are carefully vetted for hygiene and cooking quality. Each chef prepares meals in clean, inspected home kitchens.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: `RotiHai accepts ${paymentMethods}. All transactions are secure and you can pay conveniently through the app.`,
    },
    {
      question: 'How fresh is the food?',
      answer:
        'Every meal on RotiHai is made-to-order by home chefs. Food is freshly prepared after you place your order — it is never pre-cooked or reheated. This ensures you get the freshest homemade food every time.',
    },
    {
      question: 'How do I track my order?',
      answer:
        'You can track your order in real-time via the RotiHai app. Once your order is picked up, you will see live delivery tracking with estimated arrival time.',
    },
  ];

  return faqs;
}

// ─── FAQ Schema Builder ───────────────────────────────────────────────────────

/**
 * Builds a JSON-LD FAQPage schema from an array of FaqItems.
 * Produces valid schema.org FAQPage structured data for search engine rich results.
 */
export function buildFaqSchema(faqs: FaqItem[]): JsonLdSchema {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
