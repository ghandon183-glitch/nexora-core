export interface TemplateFaq { question: string; answer: string }

export interface TemplateGuide {
  slug: string;
  positioning: string;
  idealFor: string[];
  included: string[];
  requirements: string[];
  installTime: string;
  setup: string[];
  customization: string[];
  deployment: string[];
  faq: TemplateFaq[];
}

export const templateGuides: Record<string, TemplateGuide> = {
  "modern-saas": {
    slug: "modern-saas",
    positioning: "A polished SaaS marketing foundation for teams that need a credible product site quickly without starting from an empty project.",
    idealFor: ["SaaS startups", "B2B products", "Developer tools", "Product launches"],
    included: ["Responsive marketing layout", "Pricing and testimonial sections", "FAQ and conversion sections", "Dark mode", "SEO-ready structure", "Reusable Tailwind UI"],
    requirements: ["Node.js compatible with Next.js 16", "npm, pnpm, or yarn"],
    installTime: "About 5–10 minutes.",
    setup: ["Extract the package.", "Install dependencies.", "Start the development server using README.md.", "Review shared components before changing content."],
    customization: ["Replace product name, positioning, pricing, testimonials, and CTAs.", "Update colors and typography.", "Connect real signup, billing, analytics, and contact endpoints.", "Replace demo metadata and social links."],
    deployment: ["Run the production build.", "Set production environment variables.", "Deploy to a Next.js-compatible host.", "Verify canonical URLs, forms, and mobile layouts."],
    faq: [{question:"Is this a finished SaaS backend?",answer:"No. It is a front-end product site and UI foundation. Connect your own authentication, billing, database, and product APIs."},{question:"Can I use it for a client?",answer:"Yes, under the included single-end-product commercial license."}]
  },
  "admin-dashboard": {
    slug: "admin-dashboard",
    positioning: "A dense, professional dashboard foundation for analytics-heavy products where navigation, data presentation, and settings need to feel coherent from day one.",
    idealFor: ["SaaS admin areas", "Internal tools", "CRM products", "Analytics products"],
    included: ["Analytics dashboard screens", "Charts and data presentation", "Authentication UI foundation", "Role-management UI", "Settings area", "Responsive dark presentation"],
    requirements: ["Node.js compatible with Next.js 16", "A package manager", "A backend or API for real data"],
    installTime: "About 5–10 minutes.",
    setup: ["Install dependencies.", "Start the development server.", "Map supplied screens to your routes.", "Replace sample metrics with API data."],
    customization: ["Define navigation and permissions.", "Connect real authentication.", "Replace sample charts with your data.", "Tune tables, cards, filters, and settings."],
    deployment: ["Build in production mode.", "Configure auth and API variables.", "Deploy and verify protected routes server-side.", "Test keyboard and small-screen layouts."],
    faq: [{question:"Does it provide a real authentication backend?",answer:"The listing describes authentication and role-management UI; connect your production identity provider and authorization rules."},{question:"Can it become a full internal admin system?",answer:"Yes. Add your database, APIs, permissions, and audit requirements."}]
  },
  "creative-agency": {
    slug: "creative-agency",
    positioning: "A high-impact agency presentation system built around portfolio work, case studies, team content, motion, and lead generation.",
    idealFor: ["Creative agencies", "Brand studios", "Design teams", "Freelance studios"],
    included: ["Portfolio presentation", "Case-study structure", "Team section", "Contact flow", "Blog-ready structure", "Animation and responsive layouts"],
    requirements: ["Node.js compatible with Next.js 16", "A package manager", "Your own portfolio media"],
    installTime: "About 5–10 minutes.",
    setup: ["Install dependencies and run the development server.", "Replace agency identity and navigation.", "Populate projects and case studies.", "Connect the contact form."],
    customization: ["Replace demo projects and imagery.", "Tune typography and motion.", "Add your CMS or content source.", "Review SEO metadata for case studies."],
    deployment: ["Build and preview production output.", "Configure forms and analytics.", "Deploy.", "Test image loading and navigation on mobile."],
    faq: [{question:"Can I use my own portfolio photography?",answer:"Yes. Replace demo assets with media you have permission to publish."},{question:"Is a CMS included?",answer:"The template provides the presentation layer; connect the CMS or content workflow you prefer."}]
  },
  "kiln-estates": {
    slug: "kiln-estates",
    positioning: "A restrained property presentation template for boutique real-estate brands, architects, developers, and heritage-property specialists.",
    idealFor: ["Boutique real estate", "Property developers", "Architects", "Luxury property agents"],
    included: ["Listings grid", "Property detail presentation", "Editorial typography", "Responsive layouts", "Property-focused navigation"],
    requirements: ["Node.js compatible with Next.js 16", "A package manager", "Property photography and listing data"],
    installTime: "About 5–10 minutes.",
    setup: ["Install dependencies.", "Replace the property catalogue.", "Update enquiry and contact details.", "Review image licenses and listing claims."],
    customization: ["Adapt listing fields.", "Replace editorial copy and photography.", "Connect enquiries to your CRM or email.", "Add maps or booking systems if required."],
    deployment: ["Run a production build.", "Configure forms and analytics.", "Deploy.", "Check image performance on mobile networks."],
    faq: [{question:"Does it connect to a property database?",answer:"The template is the presentation layer. Connect your property feed or CMS."},{question:"Can it be used for commercial property?",answer:"Yes, after adapting the listing structure and content."}]
  },
  "nexi-ai": {
    slug: "nexi-ai",
    positioning: "A focused AI-product marketing site for teams selling agents, assistants, automation, or API-driven workflows.",
    idealFor: ["AI SaaS", "Agent products", "Automation platforms", "Developer-facing AI tools"],
    included: ["AI product hero", "Bento feature presentation", "How-it-works section", "Testimonials", "Pricing", "FAQ", "Motion"],
    requirements: ["Node.js compatible with Next.js 16", "A package manager", "Your own product messaging"],
    installTime: "About 5–10 minutes.",
    setup: ["Install dependencies.", "Replace product positioning and examples.", "Connect signup or demo CTAs.", "Review every product claim before launch."],
    customization: ["Swap feature cards for real workflows.", "Connect live demos.", "Replace pricing and testimonials.", "Add privacy and security pages appropriate to your product."],
    deployment: ["Build and deploy.", "Configure analytics and forms.", "Test reduced-motion behavior.", "Verify metadata and social previews."],
    faq: [{question:"Is an AI API included?",answer:"No. The template is a marketing and UI foundation; connect your own AI provider and backend."},{question:"Can I sell an AI SaaS with it?",answer:"Yes. It is designed as a front-end foundation for that type of product."}]
  },
  "aurelia-store": {
    slug: "aurelia-store",
    positioning: "A boutique storefront foundation for visually led commerce brands where product photography, editorial pacing, and a refined catalogue matter.",
    idealFor: ["Jewelry brands", "Ceramics", "Home objects", "Boutique retail"],
    included: ["Animated storefront hero", "Category grid", "Product presentation", "Reviews", "Newsletter", "Self-hosted font setup"],
    requirements: ["Node.js compatible with Next.js 16", "A package manager", "Product data and commerce backend"],
    installTime: "About 5–10 minutes before connecting commerce.",
    setup: ["Install dependencies.", "Replace catalogue and brand content.", "Connect product and inventory data.", "Connect checkout."],
    customization: ["Update product cards and collections.", "Replace demo photography and reviews.", "Tune type and brand colors.", "Add real shipping, returns, privacy, and tax information."],
    deployment: ["Build and test the storefront.", "Verify product links and checkout.", "Deploy.", "Test image loading, keyboard navigation, and mobile cart behavior."],
    faq: [{question:"Is payment processing included?",answer:"No. Connect Shopify, Stripe, Medusa, a headless commerce API, or your chosen provider."},{question:"Can it be used for a real store?",answer:"Yes, after commerce, inventory, tax, shipping, and legal layers are connected."}]
  },
  "solace-studio": {
    slug: "solace-studio",
    positioning: "A calm, conversion-focused studio site for yoga, Pilates, strength, and wellness businesses with schedules and membership information that are easy to scan.",
    idealFor: ["Yoga studios", "Pilates studios", "Boutique gyms", "Wellness businesses"],
    included: ["Next-class countdown", "Class schedule", "Trainer profiles", "Pricing", "Testimonials", "Gallery", "Responsive layouts"],
    requirements: ["Node.js compatible with Next.js 16", "A package manager", "Class and instructor information"],
    installTime: "About 5–10 minutes.",
    setup: ["Install dependencies.", "Replace studio identity and schedule.", "Connect booking CTAs.", "Update pricing, trainers, and location details."],
    customization: ["Match the real timetable.", "Connect booking software.", "Replace demo testimonials and photography.", "Add membership policies and waiver links."],
    deployment: ["Build and deploy.", "Verify booking links on mobile.", "Test location and contact information.", "Review gallery performance."],
    faq: [{question:"Does it include a booking engine?",answer:"The listing provides schedule and booking-oriented UI. Connect your booking provider for live reservations."},{question:"Can I use it for a gym?",answer:"Yes. Adapt class, trainer, and pricing content to your service model."}]
  },
  "premium-portfolio": {
    slug: "premium-portfolio",
    positioning: "A cinematic portfolio foundation for creative studios that want depth, motion, and project storytelling without losing a clear contact path.",
    idealFor: ["Creative studios", "Digital artists", "Directors", "Design portfolios"],
    included: ["WebGL hero", "3D scene presentation", "Project showcase", "Capabilities", "Marquee", "Scroll reveals", "Contact", "Reduced-motion handling"],
    requirements: ["Node.js compatible with Next.js 16", "A package manager", "A modern browser for the interactive hero"],
    installTime: "About 5–10 minutes.",
    setup: ["Install dependencies.", "Replace project data and media.", "Review WebGL settings.", "Connect contact and analytics."],
    customization: ["Replace project imagery and case-study copy.", "Tune motion intensity.", "Adjust the WebGL scene or disable it.", "Review reduced-motion behavior."],
    deployment: ["Build and test production output.", "Check WebGL fallback behavior.", "Deploy.", "Measure mobile performance."],
    faq: [{question:"Is WebGL mandatory?",answer:"No. The presentation can be simplified, and reduced-motion behavior should be preserved."},{question:"Is it suitable for a professional portfolio?",answer:"Yes. Replace the demo work with your own projects and case studies."}]
  },
  "aether": {
    slug: "aether",
    positioning: "An immersive creative-studio presentation for brands that want a cinematic first impression and a strong visual project showcase.",
    idealFor: ["Creative agencies", "Production studios", "Digital studios", "Art-led brands"],
    included: ["Interactive WebGL hero", "3D experience", "Project showcase", "Motion system", "Responsive editorial layout"],
    requirements: ["Node.js compatible with Next.js 16", "A modern browser", "Your own project media"],
    installTime: "About 5–10 minutes.",
    setup: ["Install dependencies.", "Replace studio identity and project content.", "Review interactive scene settings.", "Connect contact and analytics."],
    customization: ["Replace demo imagery and copy.", "Tune animation timing.", "Adapt project cards.", "Provide a non-WebGL fallback where needed."],
    deployment: ["Build and run a production preview.", "Test on mobile and lower-powered devices.", "Deploy.", "Check outbound links."],
    faq: [{question:"Will it work on mobile?",answer:"The listing describes a responsive layout; test the WebGL experience on target devices and provide a graceful fallback where needed."},{question:"Can I use it for an agency?",answer:"Yes. Replace the showcase content with your agency work."}]
  },
  "premium-blog": {
    slug: "premium-blog",
    positioning: "An editorial publishing foundation for magazines, independent publications, company journals, and content-led brands.",
    idealFor: ["Magazines", "Company blogs", "Independent publications", "Editorial brands"],
    included: ["Magazine homepage", "Article pages", "Categories", "Author page", "Trending", "Newsletter", "Dark mode", "SEO-ready structure"],
    requirements: ["Node.js compatible with Next.js 16", "A package manager", "A content source or CMS"],
    installTime: "About 5–10 minutes.",
    setup: ["Install dependencies.", "Replace sample articles and categories.", "Connect your content source.", "Configure newsletter and analytics."],
    customization: ["Define editorial taxonomy.", "Replace demo authors and imagery.", "Tune typography for long-form reading.", "Add privacy and consent requirements."],
    deployment: ["Build and deploy.", "Test article routes and metadata.", "Verify newsletter forms.", "Measure Core Web Vitals."],
    faq: [{question:"Does it include a CMS?",answer:"No. Connect the CMS or content workflow you prefer."},{question:"Can it be used for a company blog?",answer:"Yes. Adapt the editorial structure to your product or company."}]
  },
  "premium-restaurant": {
    slug: "premium-restaurant",
    positioning: "An elegant hospitality site that puts the menu, chef, atmosphere, events, hours, and reservation action in one coherent presentation.",
    idealFor: ["Fine dining", "Boutique restaurants", "Hotels", "Hospitality brands"],
    included: ["Cinematic hero", "Menu presentation", "Chef section", "Gallery", "Events", "Opening hours", "Reservation flow"],
    requirements: ["Node.js compatible with Next.js 16", "A package manager", "Real menu, venue, reservation, and contact information"],
    installTime: "About 5–10 minutes.",
    setup: ["Install dependencies.", "Replace menu and venue information.", "Connect reservation software.", "Replace demo photography and contact details."],
    customization: ["Update menu categories and pricing.", "Connect reservation provider.", "Add dietary and allergen information where appropriate.", "Review opening hours and holiday exceptions."],
    deployment: ["Build and deploy.", "Test reservation links on mobile.", "Verify phone, map, and hours information.", "Optimize gallery images."],
    faq: [{question:"Does it process reservations itself?",answer:"The listing provides reservation-oriented UI. Connect your chosen booking provider for live availability."},{question:"Can a hotel use it?",answer:"Yes, with the menu, events, and reservation sections adapted to the property."}]
  },
  "vesper": {
    slug: "vesper",
    positioning: "A complete visual system for an AI creative product: cinematic marketing pages paired with an interactive studio workspace, timeline, inspector, and reusable UI pieces.",
    idealFor: ["AI creative products", "Generative media tools", "Creative SaaS", "Product concept launches"],
    included: ["Auralis WebGL hero", "Marketing landing page system", "Interactive Studio Workspace", "Timeline and Inspector UI", "Reusable UI kit", "Responsive application chrome", "Reduced-motion-aware motion", "Local demo assets", "React 19 + TypeScript", "Vite + Tailwind CSS 4", "Productization documentation"],
    requirements: ["Node.js compatible with the supplied Vite/React stack", "npm, pnpm, or yarn", "A modern browser"],
    installTime: "About 5–10 minutes.",
    setup: ["Extract the package.", "Install dependencies.", "Run the development command documented in README.md.", "Review the data and asset modules before editing UI."],
    customization: ["Replace product identity, copy, pricing, testimonials, and CTAs.", "Swap supplied assets for assets you are licensed to use.", "Connect authentication, storage, AI APIs, billing, and persistence for a real SaaS.", "Keep reduced-motion behavior intact."],
    deployment: ["Run the production Vite build.", "Configure integration environment variables.", "Deploy to your preferred static or edge host.", "Test WebGL and mobile behavior on real devices."],
    faq: [{question:"Is Vesper a working AI backend?",answer:"No. It is a premium front-end product template and interactive UI foundation. Connect the real AI, accounts, storage, billing, and persistence layers yourself."},{question:"Can I build a commercial SaaS on it?",answer:"Yes, under the included single-end-product commercial license."},{question:"Are included images cleared for every use?",answer:"Review the package asset notes and replace any demo asset whose license does not fit your final project."}]
  }
};

export function getTemplateGuide(slug: string) {
  return templateGuides[slug];
}
