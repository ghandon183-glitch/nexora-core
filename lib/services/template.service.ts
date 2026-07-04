import { getAllTemplates, getTemplate } from "@/lib/data/get-template";

export class TemplateService {
  static getAll() {
    return getAllTemplates();
  }

  static getBySlug(slug: string) {
    return getTemplate(slug);
  }

  static getByCategory(category: string) {
    return getAllTemplates().filter(
      (template) => template.category === category
    );
  }

  static getByTag(tag: string) {
    return getAllTemplates().filter((template) =>
      template.tags.includes(tag)
    );
  }

  static getFeatured() {
    return getAllTemplates().filter(
      (template) =>
        template.badge === "Popular" ||
        template.badge === "Premium"
    );
  }

  static getLatest(limit = 6) {
    return [...getAllTemplates()]
      .sort(
        (a, b) =>
          new Date(b.lastUpdate).getTime() -
          new Date(a.lastUpdate).getTime()
      )
      .slice(0, limit);
  }
}