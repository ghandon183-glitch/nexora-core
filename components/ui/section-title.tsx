interface SectionTitleProps {
  badge: string;
  title: string;
  description: string;
}

import Badge from "./badge";

export default function SectionTitle({
  badge,
  title,
  description,
}: SectionTitleProps) {
  return (
    <div className="text-center">

      <Badge>
        {badge}
      </Badge>

      <h2 className="mt-6 text-5xl font-black text-white">
        {title}
      </h2>

      <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-400">
        {description}
      </p>

    </div>
  );
}