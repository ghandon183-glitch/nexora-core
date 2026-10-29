/**
 * Builds the GA4 `view_item` payload from a product page's analytics marker.
 *
 * Extracted from the client component so the mapping (which product, which
 * price, which item id) can be unit tested without a browser. Returns null when
 * the page is not a single-product view, so non-product routes never emit an
 * empty view_item event.
 */
export interface ViewItemDataset {
  analyticsTemplate?: string;
  analyticsName?: string;
  analyticsCategory?: string;
  analyticsPrice?: string;
}

export interface ViewItemEvent {
  event: "view_item";
  params: {
    template_slug: string;
    currency: "USD";
    value: number;
    items: {
      item_id: string;
      item_name: string;
      item_category?: string;
      price: number;
      quantity: 1;
    }[];
  };
}

function parsePrice(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function buildViewItemEvent(
  dataset: ViewItemDataset | null | undefined
): ViewItemEvent | null {
  const slug = dataset?.analyticsTemplate?.trim();
  if (!slug) return null;

  const price = parsePrice(dataset?.analyticsPrice);
  const name = dataset?.analyticsName?.trim() || slug;
  const category = dataset?.analyticsCategory?.trim() || undefined;

  return {
    event: "view_item",
    params: {
      template_slug: slug,
      currency: "USD",
      value: price,
      items: [
        {
          item_id: `nexora-${slug}`,
          item_name: name,
          item_category: category,
          price,
          quantity: 1,
        },
      ],
    },
  };
}
