import TextRevealByWord from "./text-reveal";

export function TextRevealDemo() {
  return (
    <div className="h-[200vh] flex items-center justify-center bg-white dark:bg-black">
      <TextRevealByWord text="From localhost to liftoff 🚀 — your site's live in just" />
    </div>
  );
}
