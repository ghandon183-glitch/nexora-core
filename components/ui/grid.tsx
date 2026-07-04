interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}

export default function Grid({
  children,
  className = "",
  cols = 3,
}: GridProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 xl:grid-cols-3",
    4: "md:grid-cols-2 xl:grid-cols-4",
  };

  return (
    <div
      className={`grid gap-8 ${gridCols[cols]} ${className}`}
    >
      {children}
    </div>
  );
}