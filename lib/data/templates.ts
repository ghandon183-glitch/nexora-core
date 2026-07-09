export interface Template {
  slug: string;

  title: string;
  description: string;

  image: string;
  gallery: string[];

  badge: string;

  category: string;
  tags: string[];

  framework: string;
  styling: string;
  components: number;

  version: string;
  lastUpdate: string;

  price: number;

  demoUrl: string;
  purchaseUrl: string;
  documentationUrl: string;

  features: string[];

  changelog: {
    version: string;
    date: string;
    changes: string[];
  }[];
}

export const templates: Template[] = [
  {
    slug: "modern-saas",

    title: "Modern SaaS",

    description:
      "Beautiful SaaS landing page built with Next.js 15 and Tailwind CSS.",

    image: "/templates/modern-saas.jpg",

    gallery: [
      "/templates/gallery/modern-saas/1.jpg",
      "/templates/gallery/modern-saas/2.jpg",
      "/templates/gallery/modern-saas/3.jpg",
      "/templates/gallery/modern-saas/4.jpg",
    ],

    badge: "Popular",

    category: "Landing Page",

    tags: [
      "SaaS",
      "Startup",
      "Marketing",
      "Next.js",
      "Tailwind",
    ],

    framework: "Next.js 15",

    styling: "Tailwind CSS",

    components: 120,

    version: "2.3.0",

    lastUpdate: "2026-06-28",

    price: 49,

    demoUrl: "/demo/modern-saas/index.html",

    purchaseUrl: "#",

    documentationUrl: "#",

    features: [
      "Responsive Layout",
      "Dark Mode",
      "SEO Optimized",
      "Modern Hero Section",
      "Pricing Section",
      "Testimonials",
      "FAQ",
      "Animations",
      "Blog Pages",
      "Contact Form",
    ],

    changelog: [
      {
        version: "2.3.0",
        date: "2026-06-28",
        changes: [
          "Improved Hero section",
          "Performance optimization",
          "New Pricing Blocks",
        ],
      },
      {
        version: "2.2.0",
        date: "2026-05-10",
        changes: [
          "Added Blog",
          "Improved Mobile Layout",
        ],
      },
    ],
  },

  {
    slug: "admin-dashboard",

    title: "Admin Dashboard",

    description:
      "Professional analytics dashboard built for modern SaaS products.",

    image: "/templates/admin-dashboard.jpg",

    gallery: [
      "/templates/gallery/admin-dashboard/1.jpg",
      "/templates/gallery/admin-dashboard/2.jpg",
      "/templates/gallery/admin-dashboard/3.jpg",
      "/templates/gallery/admin-dashboard/4.jpg",
    ],

    badge: "Premium",

    category: "Dashboard",

    tags: [
      "Admin",
      "CRM",
      "Analytics",
      "Dashboard",
    ],

    framework: "Next.js 15",

    styling: "Tailwind CSS",

    components: 145,

    version: "1.8.0",

    lastUpdate: "2026-06-20",

    price: 69,

    demoUrl: "/demo/admin-dashboard/index.html",

    purchaseUrl: "#",

    documentationUrl: "#",

    features: [
      "Charts",
      "Dark Mode",
      "Authentication",
      "Role Management",
      "Analytics",
      "Settings",
      "Notifications",
      "Tables",
    ],

    changelog: [
      {
        version: "1.8.0",
        date: "2026-06-20",
        changes: [
          "New Charts",
          "Bug Fixes",
          "Performance Improvements",
        ],
      },
    ],
  },

  {
    slug: "creative-agency",

    title: "Creative Agency",

    description:
      "Premium creative agency website with beautiful animations.",

    image: "/templates/creative-agency.jpg",

    gallery: [
      "/templates/gallery/creative-agency/1.jpg",
      "/templates/gallery/creative-agency/2.jpg",
      "/templates/gallery/creative-agency/3.jpg",
      "/templates/gallery/creative-agency/4.jpg",
    ],

    badge: "New",

    category: "Agency",

    tags: [
      "Agency",
      "Portfolio",
      "Creative",
    ],

    framework: "Next.js 15",

    styling: "Tailwind CSS",

    components: 132,

    version: "1.2.0",

    lastUpdate: "2026-06-25",

    price: 59,

    demoUrl: "/demo/creative-agency/index.html",

    purchaseUrl: "#",

    documentationUrl: "#",

    features: [
      "Portfolio",
      "Case Studies",
      "Animations",
      "Team Section",
      "Contact Form",
      "SEO Ready",
      "Blog",
    ],

    changelog: [
      {
        version: "1.2.0",
        date: "2026-06-25",
        changes: [
          "New Portfolio Layout",
          "Improved Animations",
        ],
      },
    ],
  },
];