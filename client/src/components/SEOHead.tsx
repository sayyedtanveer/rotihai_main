import { Helmet } from 'react-helmet-async';
import type { SeoMetadata } from '@shared/seo/generateSeoMetadata';

interface SEOHeadProps {
  metadata: SeoMetadata;
}

export function SEOHead({ metadata }: SEOHeadProps) {
  return (
    <Helmet>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <link rel="canonical" href={metadata.canonical} />
      <meta name="robots" content={metadata.robots} />
      {Object.entries(metadata.og).map(([property, content]) => (
        <meta key={property} property={property} content={content} />
      ))}
      {Object.entries(metadata.twitter).map(([name, content]) => (
        <meta key={name} name={name} content={content} />
      ))}
      {metadata.jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
