export interface Template {
  id: string;
  slug: string;

  title: string;
  description: string;

  category: string;

  badge?: string;

  price: number;

  image: string;

  framework: string;

  styling: string;

  components: number;
}