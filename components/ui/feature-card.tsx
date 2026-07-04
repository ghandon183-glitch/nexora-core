import Card from "./card";

interface FeatureCardProps {
  title: string;
  description: string;
}

export default function FeatureCard({
  title,
  description,
}: FeatureCardProps) {
  return (
    <Card className="h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30">

      <div className="mb-5 h-12 w-12 rounded-2xl bg-cyan-500/10" />

      <h3 className="text-xl font-bold text-white">
        {title}
      </h3>

      <p className="mt-4 leading-7 text-slate-400">
        {description}
      </p>

    </Card>
  );
}