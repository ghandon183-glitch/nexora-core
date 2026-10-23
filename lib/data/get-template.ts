import { templates } from "./templates";

export function getTemplate(slug: string) {
  return templates.find((template) => template.slug === slug);
}

export function getAllTemplates() {
  return templates.filter((template) => !template.hidden);
}

/**
 * Select a small, contextual set of template links for a product detail page.
 * Prefer category and shared-tag matches; never include the current template.
 */
export function getRelatedTemplates(slug: string, limit = 3) {
  const current = getTemplate(slug);
  const currentTags = new Set((current?.tags ?? []).map((tag) => tag.toLowerCase()));
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 3;

  return getAllTemplates()
    .filter((template) => template.slug !== slug)
    .map((template) => {
      const sharedTags = template.tags.filter((tag) => currentTags.has(tag.toLowerCase())).length;
      const score = current
        ? (template.category === current.category ? 10 : 0) +
          sharedTags * 2 +
          (template.framework === current.framework ? 1 : 0) +
          (template.styling === current.styling ? 1 : 0)
        : 0;
      return { template, score };
    })
    .sort((a, b) => b.score - a.score || a.template.title.localeCompare(b.template.title))
    .slice(0, safeLimit)
    .map(({ template }) => template);
}
