import { TemplateService } from "@/lib/services/template.service";

export class SearchQuery {
  static search(keyword: string) {
    const query = keyword.trim().toLowerCase();

    if (!query) {
      return TemplateService.getAll();
    }

    return TemplateService.getAll().filter((template) => {
      return (
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query) ||
        template.framework.toLowerCase().includes(query) ||
        template.tags.some((tag) =>
          tag.toLowerCase().includes(query)
        )
      );
    });
  }
}