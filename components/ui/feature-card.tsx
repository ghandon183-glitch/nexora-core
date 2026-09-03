import Card from "./card";

interface FeatureCardProps { title: string; description: string; }

export default function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <Card className="h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#d9b06c]/35">
      <div className="mb-5 h-12 w-12 rounded-2xl border border-[#d9b06c]/15 bg-[#c79a57]/10" />
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-4 leading-7 text-[#b6a888]">{description}</p>
    </Card>
  );
}
