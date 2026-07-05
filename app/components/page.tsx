"use client";

import Navbar from "@/components/navigation/navbar";
import FloatingDock from "@/components/navigation/floating-dock";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Tabs from "@/components/ui/tabs";
import FeatureCard from "@/components/ui/feature-card";

interface ShowcaseProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function Showcase({ title, description, children }: ShowcaseProps) {
  return (
    <Card className="p-8 hover:-translate-y-0 hover:border-white/10">

      <h3 className="text-xl font-bold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        {description}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-8">
        {children}
      </div>

    </Card>
  );
}

export default function ComponentsPage() {
  return (
    <>
      <Navbar />
      <FloatingDock />

      <Section>
        <div className="mx-auto max-w-7xl">

          <Heading
            badge="Components"
            title="Built with these components"
            description="A live look at the UI primitives that power every Nexora Core template — the same Button, Card, and form components you'll get in the code."
            align="center"
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-2">

            <Showcase
              title="Button"
              description="Three variants: primary, outline, and ghost."
            >
              <Button>Primary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </Showcase>

            <Showcase
              title="Badge"
              description="Default, success, and warning states."
            >
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
            </Showcase>

            <Showcase
              title="Input"
              description="Form input with focus ring and placeholder styling."
            >
              <Input placeholder="you@example.com" className="max-w-xs" />
            </Showcase>

            <Showcase
              title="Card"
              description="The base surface used across dashboards, pricing, and product pages."
            >
              <Card className="w-full max-w-xs p-6 hover:-translate-y-0 hover:border-white/10">
                <p className="font-semibold text-white">
                  Card title
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Any content can live inside a Card.
                </p>
              </Card>
            </Showcase>

            <Showcase
              title="Feature Card"
              description="Card + icon slot, used for feature grids."
            >
              <div className="w-full max-w-xs">
                <FeatureCard
                  title="Fast by default"
                  description="Optimized for Core Web Vitals out of the box."
                />
              </div>
            </Showcase>

            <Showcase
              title="Tabs"
              description="Used on template detail pages for overview, reviews, FAQ, and changelog."
            >
              <div className="w-full">
                <Tabs
                  items={[
                    {
                      id: "one",
                      label: "Overview",
                      content: (
                        <p className="text-sm text-slate-300">
                          Tab content renders here.
                        </p>
                      ),
                    },
                    {
                      id: "two",
                      label: "Details",
                      content: (
                        <p className="text-sm text-slate-300">
                          Switch tabs to see this change.
                        </p>
                      ),
                    },
                  ]}
                />
              </div>
            </Showcase>

          </div>

          <Card className="mt-10 p-10 text-center hover:-translate-y-0 hover:border-white/10">
            <p className="text-slate-400">
              More components (Modal, Avatar, Stat Card, Tag, and more) are
              in active development and will show up here as they ship.
            </p>
          </Card>

        </div>
      </Section>
    </>
  );
}
