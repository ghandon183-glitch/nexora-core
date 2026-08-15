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

  {
    slug: "kiln-estates",

    title: "Kiln Estates",

    description:
      "A boutique real estate template for architect-designed and heritage homes, built with Next.js 16 and Tailwind CSS.",

    image: "/templates/kiln-estates.jpg",

    gallery: [
      "/templates/gallery/kiln-estates/1.jpg",
      "/templates/gallery/kiln-estates/2.jpg",
      "/templates/gallery/kiln-estates/3.jpg",
      "/templates/gallery/kiln-estates/4.jpg",
    ],

    badge: "New",

    category: "Real Estate",

    tags: [
      "Real Estate",
      "Property",
      "Editorial",
      "Next.js",
      "Tailwind",
    ],

    framework: "Next.js 16",

    styling: "Tailwind CSS",

    components: 20,

    version: "1.0.0",

    lastUpdate: "2026-07-12",

    price: 55,

    demoUrl: "/demo/kiln-estates/index.html",

    purchaseUrl: "#",

    documentationUrl: "#",

    features: [
      "Listings Grid",
      "Property Detail Pages",
      "Material Swatch Component",
      "Editorial Typography System",
      "Warm Custom Color Theme",
      "Responsive Layout",
      "Contact Form UI",
      "Static Generation",
    ],

    changelog: [
      {
        version: "1.0.0",
        date: "2026-07-12",
        changes: [
          "Initial release",
        ],
      },
    ],
  },
  {
    slug: "nexi-ai",

    title: "Nexi AI",

    description:
      "A high-converting landing page template for AI agent, chatbot, and automation products, with a live agent chat mockup and visible reasoning trace.",

    image: "/templates/nexi-ai.jpg",

    gallery: [
      "/templates/gallery/nexi-ai/1.jpg",
      "/templates/gallery/nexi-ai/2.jpg",
      "/templates/gallery/nexi-ai/3.jpg",
      "/templates/gallery/nexi-ai/4.jpg",
    ],

    badge: "New",

    category: "AI Product",

    tags: [
      "AI",
      "SaaS",
      "Landing Page",
      "Next.js",
      "Tailwind",
    ],

    framework: "Next.js 16",

    styling: "Tailwind CSS",

    components: 24,

    version: "1.0.0",

    lastUpdate: "2026-07-14",

    price: 65,

    demoUrl: "/demo/nexi-ai/index.html",

    purchaseUrl: "#",

    documentationUrl: "#",

    features: [
      "Live Agent Chat Mockup",
      "Visible Reasoning Trace",
      "Bento Grid Features",
      "4-Step How It Works",
      "Testimonials",
      "3-Tier Pricing",
      "Accordion FAQ",
      "Framer Motion Animations",
    ],

    changelog: [
      {
        version: "1.0.0",
        date: "2026-07-14",
        changes: [
          "Initial release",
        ],
      },
    ],
  },

  {
    slug: "aurelia-store",

    title: "Aurelia",

    description:
      "A boutique e-commerce storefront template for jewelry, ceramics, and home objects, with a signature hanging price-tag animation on the hero.",

    image: "/templates/aurelia-store.jpg",

    gallery: [
      "/templates/gallery/aurelia-store/1.jpg",
      "/templates/gallery/aurelia-store/2.jpg",
      "/templates/gallery/aurelia-store/3.jpg",
      "/templates/gallery/aurelia-store/4.jpg",
    ],

    badge: "New",

    category: "E-commerce",

    tags: [
      "E-commerce",
      "Storefront",
      "Jewelry",
      "Next.js",
      "Tailwind",
    ],

    framework: "Next.js 16",

    styling: "Tailwind CSS",

    components: 20,

    version: "1.0.0",

    lastUpdate: "2026-07-24",

    price: 59,

    demoUrl: "/demo/aurelia-store/index.html",

    purchaseUrl: "#",

    documentationUrl: "#",

    features: [
      "Signature Hero Animation (GSAP)",
      "Category Grid",
      "Featured Products Grid",
      "Bestsellers Grid",
      "Customer Reviews",
      "Newsletter Signup",
      "Self-Hosted Fonts (No External Requests)",
      "Framer Motion Scroll Reveals",
    ],

    changelog: [
      {
        version: "1.0.0",
        date: "2026-07-24",
        changes: [
          "Initial release",
        ],
      },
    ],
  },

  {
    slug: "solace-studio",

    title: "Solace Studio",

    description:
      "A boutique yoga, pilates, and strength studio template with a live 'next class' countdown badge and a calm forest/cream/clay/mustard palette.",

    image: "/templates/solace-studio.jpg",

    gallery: [
      "/templates/gallery/solace-studio/1.jpg",
      "/templates/gallery/solace-studio/2.jpg",
      "/templates/gallery/solace-studio/3.jpg",
      "/templates/gallery/solace-studio/4.jpg",
    ],

    badge: "New",

    category: "Fitness & Wellness",

    tags: [
      "Yoga",
      "Fitness",
      "Wellness",
      "Next.js",
      "Tailwind",
    ],

    framework: "Next.js 16",

    styling: "Tailwind CSS",

    components: 18,

    version: "1.0.0",

    lastUpdate: "2026-07-31",

    price: 55,

    demoUrl: "/demo/solace-studio/index.html",

    purchaseUrl: "#",

    documentationUrl: "#",

    features: [
      "Live 'Next Class' Countdown Badge",
      "Class Schedule Grid",
      "Trainer Profiles",
      "Pricing Plans",
      "Testimonials",
      "Instagram-Style Gallery",
      "Newsletter Signup",
      "Self-Hosted Fonts (No External Requests)",
      "Framer Motion Scroll Reveals",
    ],

    changelog: [
      {
        version: "1.0.0",
        date: "2026-07-31",
        changes: [
          "Initial release",
        ],
      },
    ],
  },

  {
    slug: "premium-portfolio",

    title: "Premium Portfolio",

    description:
      "A sophisticated dark-mode portfolio for creative developers and designers — animated hero, project grid with generated visuals, services, timeline, testimonials, and a contact form.",

    image: "/templates/premium-portfolio.jpg",

    gallery: [
      "/templates/gallery/premium-portfolio/1.jpg",
      "/templates/gallery/premium-portfolio/2.jpg",
      "/templates/gallery/premium-portfolio/3.jpg",
      "/templates/gallery/premium-portfolio/4.jpg",
    ],

    badge: "New",

    category: "Portfolio",

    tags: [
      "Portfolio",
      "Developer",
      "Designer",
      "Next.js",
      "Tailwind",
    ],

    framework: "Next.js 16",

    styling: "Tailwind CSS",

    components: 22,

    version: "1.0.0",

    lastUpdate: "2026-08-14",

    price: 59,

    demoUrl: "/demo/premium-portfolio/index.html",

    purchaseUrl: "#",

    documentationUrl: "#",

    features: [
      "Animated Hero with Staggered Reveals",
      "Project Grid with Generated SVG Visuals",
      "Services Section with Numbered Cards",
      "Experience Timeline",
      "Capabilities & Tech Stack",
      "Testimonials",
      "Contact Form with Success State",
      "Reduced-Motion Friendly Animations",
      "Self-Hosted Fonts (No External Requests)",
      "SEO & Open Graph Metadata",
    ],

    changelog: [
      {
        version: "1.0.0",
        date: "2026-08-14",
        changes: [
          "Initial release",
        ],
      },
    ],
  },

  {
    slug: "premium-blog",

    title: "Premium Blog",

    description:
      "An editorial magazine template with a featured essay, article grid, dynamic article pages, category and author pages, trending, and a newsletter CTA. Built in Lora serif and Inter.",

    image: "/templates/premium-blog.jpg",

    gallery: [
      "/templates/gallery/premium-blog/1.jpg",
      "/templates/gallery/premium-blog/2.jpg",
      "/templates/gallery/premium-blog/3.jpg",
      "/templates/gallery/premium-blog/4.jpg",
    ],

    badge: "New",

    category: "Blog & Magazine",

    tags: [
      "Blog",
      "Magazine",
      "Editorial",
      "Next.js",
      "Tailwind",
    ],

    framework: "Next.js 16",

    styling: "Tailwind CSS",

    components: 26,

    version: "1.0.0",

    lastUpdate: "2026-08-14",

    price: 65,

    demoUrl: "/demo/premium-blog/index.html",

    purchaseUrl: "#",

    documentationUrl: "#",

    features: [
      "Magazine Homepage with Featured Essay",
      "Dynamic Article Detail Pages",
      "Category Listing Pages (Static-Generated)",
      "Author Profile Page",
      "About Page with Stats",
      "Trending Section",
      "Newsletter CTA with Success State",
      "Generated SVG Cover Art per Article",
      "Rich Prose Styling (Headings, Quotes, Lists)",
      "Light & Dark Mode",
      "SEO Metadata & Open Graph per Article",
    ],

    changelog: [
      {
        version: "1.0.0",
        date: "2026-08-14",
        changes: [
          "Initial release",
        ],
      },
    ],
  },

  {
    slug: "premium-restaurant",

    title: "Premium Restaurant",

    description:
      "An elegant fine-dining restaurant template with a cinematic hero, philosophy, full menu, chef profile, gallery, events, hours, and an interactive reservation flow. Warm dark palette with gold accents.",

    image: "/templates/premium-restaurant.jpg",

    gallery: [
      "/templates/gallery/premium-restaurant/1.jpg",
      "/templates/gallery/premium-restaurant/2.jpg",
      "/templates/gallery/premium-restaurant/3.jpg",
      "/templates/gallery/premium-restaurant/4.jpg",
    ],

    badge: "New",

    category: "Restaurant & Hospitality",

    tags: [
      "Restaurant",
      "Fine Dining",
      "Reservation",
      "Next.js",
      "Tailwind",
    ],

    framework: "Next.js 16",

    styling: "Tailwind CSS",

    components: 24,

    version: "1.0.0",

    lastUpdate: "2026-08-14",

    price: 69,

    demoUrl: "/demo/premium-restaurant/index.html",

    purchaseUrl: "#",

    documentationUrl: "#",

    features: [
      "Cinematic Hero with Animated Stats",
      "Philosophy Section (Live Fire, Local Pantry)",
      "Homepage Menu Preview + Full Menu Page",
      "Chef Profile with Signature",
      "Gallery Grid with Generated SVG Visuals",
      "Testimonials from Press & Regulars",
      "Upcoming Events Listing",
      "Hours, Location & Contact Details",
      "Interactive Reservation Page",
      "Date, Party Size & Time Selectors",
      "Reservation Success State",
      "Self-Hosted Fonts (No External Requests)",
    ],

    changelog: [
      {
        version: "1.0.0",
        date: "2026-08-14",
        changes: [
          "Initial release",
        ],
      },
    ],
  },
];