export interface SeoGuide {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  sections: { heading: string; body: string; bullets?: string[] }[];
}

export const seoGuides: SeoGuide[] = [
  {
    slug: "nextjs-templates-for-saas",
    title: "Next.js Templates for SaaS Products",
    description:
      "A practical comparison of premium Next.js templates for SaaS launches, product marketing sites, dashboards, and AI products.",
    eyebrow: "SaaS template guide",
    intro:
      "Choosing a SaaS template is mostly about matching the shipped interface to the product stage you are building. Compare the page structure, dashboard needs, interaction model, and integration surface before choosing a starting point.",
    sections: [
      {
        heading: "For a SaaS marketing launch",
        body:
          "Modern SaaS is structured around a marketing hierarchy with pricing, social proof, FAQ, responsive layouts, and reusable Tailwind UI. It is intended as a front-end launch foundation rather than a complete SaaS backend.",
        bullets: ["Marketing pages", "Pricing and FAQ", "Responsive UI", "Next.js and Tailwind"],
      },
      {
        heading: "For an application dashboard",
        body:
          "Admin Dashboard focuses on analytics, navigation, authentication UI, role-management screens, settings, and chart-oriented product surfaces. It is the closer fit when the main deliverable is an application shell.",
        bullets: ["Analytics views", "Charts", "Role-management UI", "Settings"],
      },
      {
        heading: "For an AI product",
        body:
          "Nexi AI and Vesper target AI-product presentation in different ways. Nexi AI is a focused marketing foundation for AI agents, assistants, automation, and APIs. Vesper combines a cinematic AI creative product site with an interactive studio workspace.",
        bullets: ["AI SaaS marketing", "Agent and automation products", "Creative AI interfaces", "Interactive product UI"],
      },
      {
        heading: "What a template does not replace",
        body:
          "A template supplies presentation and UI code. Production authentication, billing, data persistence, AI providers, analytics, CMS integrations, privacy controls, and business-specific legal content still need to be connected and verified.",
      },
    ],
  },
  {
    slug: "ai-saas-templates",
    title: "AI SaaS Website Templates",
    description:
      "Compare Nexora Core templates designed for AI SaaS, agent products, automation tools, and creative AI interfaces.",
    eyebrow: "AI product guide",
    intro:
      "AI products often need two different surfaces: a clear marketing story for visitors and a usable application interface for customers. The right template depends on which surface you need to build first.",
    sections: [
      {
        heading: "Nexi AI — focused AI-product marketing",
        body:
          "Nexi AI is positioned for AI SaaS, agent products, automation platforms, and developer-facing AI tools. Its included structure covers an AI product hero, feature presentation, how-it-works section, testimonials, pricing, FAQ, and motion.",
      },
      {
        heading: "Vesper — marketing plus interactive studio UI",
        body:
          "Vesper is a front-end product template for AI creative products. Its package includes a cinematic hero, marketing system, interactive studio workspace, timeline and inspector UI, reusable UI pieces, and React 19 + TypeScript + Vite + Tailwind CSS 4.",
      },
      {
        heading: "A practical selection checklist",
        body:
          "Check whether the template matches the actual product surface you need, then verify the shipped stack, responsive behavior, demo, documentation, asset notes, and integration requirements.",
        bullets: [
          "Marketing-only or application UI",
          "Framework and styling stack",
          "Real shipped demo",
          "Documentation and package contents",
          "Third-party asset review",
        ],
      },
    ],
  },
  {
    slug: "creative-agency-website-templates",
    title: "Creative Agency Website Templates",
    description:
      "Compare premium creative-agency and portfolio templates for studios, production teams, directors, and visual brands.",
    eyebrow: "Agency template guide",
    intro:
      "Creative agency sites usually need strong project presentation without hiding the contact path. Nexora Core includes several templates that approach this problem with different levels of motion and interactivity.",
    sections: [
      {
        heading: "Creative Agency",
        body:
          "Creative Agency is a presentation system for portfolios, case studies, teams, contact generation, editorial content, SEO, and motion-led storytelling.",
      },
      {
        heading: "Studio North / Premium Portfolio",
        body:
          "Premium Portfolio is a cinematic portfolio foundation with a WebGL hero, project showcase, capabilities, marquee, scroll reveals, contact flow, and reduced-motion handling.",
      },
      {
        heading: "Aether",
        body:
          "Aether is an immersive creative-studio presentation with an interactive WebGL hero, 3D experience, project showcase, motion system, and responsive editorial layout.",
      },
      {
        heading: "Before publishing",
        body:
          "Replace demo projects, testimonials, photography, logos, and other supplied content with material you have permission to publish. Test the interactive experience on target mobile and lower-powered devices.",
      },
    ],
  },
  {
    slug: "how-to-choose-a-premium-nextjs-template",
    title: "How to Choose a Premium Next.js Template",
    description:
      "A practical checklist for evaluating a premium Next.js template before buying: code quality, demo fidelity, documentation, licensing, performance, and integrations.",
    eyebrow: "Buying guide",
    intro:
      "A polished screenshot is not enough to evaluate a code template. Before buying, inspect the shipped source, live demo, documentation, responsive behavior, dependency stack, asset notes, and what remains for a production deployment.",
    sections: [
      {
        heading: "1. Verify the actual shipped demo",
        body:
          "A useful template should have a demo that reflects the package you receive. Compare the product page screenshots and walkthrough with the live demo rather than relying only on concept images.",
      },
      {
        heading: "2. Check the stack and package contents",
        body:
          "Confirm the framework, styling system, package manager expectations, source structure, assets, README, license, and installation steps. A template is easier to maintain when the shipped package and documentation agree.",
      },
      {
        heading: "3. Check production boundaries",
        body:
          "Marketing UI is not the same thing as a complete backend. Identify integrations you still need, such as authentication, billing, CMS, database persistence, analytics, forms, email, or external APIs.",
      },
      {
        heading: "4. Review licenses and demo assets",
        body:
          "Review asset-license notes and replace demo imagery, testimonials, logos, fonts, icons, or other content when the original terms do not fit your final project.",
      },
      {
        heading: "5. Test mobile and accessibility behavior",
        body:
          "Check keyboard navigation, focus states, reduced-motion behavior, responsive layouts, image loading, and interactive components on real target devices before launch.",
      },
    ],
  },
];
