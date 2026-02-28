import Script from "next/script";

/**
 * Microsoft Clarity heatmap and session recording integration.
 * Only loads when NEXT_PUBLIC_CLARITY_PROJECT_ID is set.
 * @see https://clarity.microsoft.com/
 */
export function ClarityScript() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  if (!projectId) return null;

  return (
    <Script
      id="microsoft-clarity"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","${projectId}");
        `,
      }}
    />
  );
}
