export function BackgroundGlow() {
  return (
    <>
      <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[140px]" />
      <div className="absolute bottom-10 left-20 h-80 w-80 rounded-full bg-violet-600/20 blur-[140px]" />
      <div className="absolute right-20 top-40 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[140px]" />
    </>
  );
}