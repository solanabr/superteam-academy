export function blocksToHtml(blocks: any[] = []): string {
  if (!blocks || !Array.isArray(blocks)) return '';
  
  try {
    let html = '';
    let inList = false;
    let listType: 'bullet' | 'number' | null = null;

    blocks.forEach((block) => {
      if (block._type !== 'block') {
        // Handle other types if needed (images, etc)
        return;
      }

      const { children = [], style = 'normal', listItem, markDefs = [] } = block;

      // Process children with marks
      const content = children
        .map((child: any) => {
          let text = child.text || '';
          
          // Apply marks (bold, italic, etc)
          if (child.marks && child.marks.length > 0) {
            child.marks.forEach((markKey: string) => {
              // Check if it's a decorator (strong, em)
              if (markKey === 'strong') text = `<strong>${text}</strong>`;
              if (markKey === 'em') text = `<em>${text}</em>`;
              if (markKey === 'code') text = `<code>${text}</code>`;
              if (markKey === 'underline') text = `<u>${text}</u>`;
              
              // Check if it's a link (markDef)
              const link = markDefs.find((def: any) => def._key === markKey);
              if (link && link._type === 'link') {
                text = `<a href="${link.href}" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">${text}</a>`;
              }
            });
          }
          return text;
        })
        .join('');

      // Handle list items
      if (listItem) {
        if (!inList || listType !== listItem) {
          if (inList) html += listType === 'bullet' ? '</ul>' : '</ol>';
          html += listItem === 'bullet' ? '<ul class="list-disc pl-6 mb-4 space-y-2">' : '<ol class="list-decimal pl-6 mb-4 space-y-2">';
          inList = true;
          listType = listItem as any;
        }
        html += `<li>${content}</li>`;
        return;
      }

      // Close list if we were in one
      if (inList) {
        html += listType === 'bullet' ? '</ul>' : '</ol>';
        inList = false;
        listType = null;
      }

      // Handle headings and normal text
      const tag =
        style === 'h1' ? 'h1' :
        style === 'h2' ? 'h2' :
        style === 'h3' ? 'h3' :
        style === 'h4' ? 'h4' :
        style === 'h5' ? 'h5' :
        style === 'h6' ? 'h6' : 
        style === 'blockquote' ? 'blockquote' : 'p';
        
      const className = 
        style === 'h1' ? 'text-3xl font-bold mb-4 mt-6 text-foreground' :
        style === 'h2' ? 'text-2xl font-bold mb-3 mt-5 text-foreground' :
        style === 'h3' ? 'text-xl font-bold mb-2 mt-4 text-foreground' :
        style === 'blockquote' ? 'border-l-4 border-primary pl-4 italic my-4 text-muted-foreground' : 'mb-6 leading-relaxed';

      html += `<${tag} class="${className}">${content}</${tag}>`;
    });

    // Final list closure
    if (inList) {
      html += listType === 'bullet' ? '</ul>' : '</ol>';
    }

    return html;
  } catch (err) {
    console.error('Error parsing PortableText blocks:', err);
    return '';
  }
}
