export interface TemplateFeature {
  title: string;
  description: string;
}

export interface TemplateChangelog {
  version: string;
  date: string;
  changes: string[];
}

export interface Template {
  id: string;

  slug: string;

  title: string;

  description: string;

  badge: string;

  category: string;

  tags: string[];

  framework: string;

  styling: string;

  components: number;

  version: string;

  lastUpdate: string;

  license: string;

  price: number;

  preview: string;

  thumbnail: string;

  gallery: string[];

  features: TemplateFeature[];

  changelog: TemplateChangelog[];
}