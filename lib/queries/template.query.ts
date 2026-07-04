import { TemplateService } from "@/lib/services/template.service";

export class TemplateQuery {
  static all() {
    return TemplateService.getAll();
  }

  static bySlug(slug: string) {
    return TemplateService.getBySlug(slug);
  }

  static featured() {
    return TemplateService.getFeatured();
  }

  static latest(limit = 6) {
    return TemplateService.getLatest(limit);
  }

  static category(category: string) {
    return TemplateService.getByCategory(category);
  }

  static tag(tag: string) {
    return TemplateService.getByTag(tag);
  }
}