import { templates } from "./templates";

export function getTemplate(slug: string) {
  return templates.find((template) => template.slug === slug);
}

export function getAllTemplates() {
  return templates;
}