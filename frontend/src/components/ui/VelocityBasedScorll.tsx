import { VelocityScroll } from "./scroll-based-velocity";

export function ScrollBasedVelocityDemo() {
  return (
    <VelocityScroll
      text="Take your Localhost places it is never been before."
      default_velocity={2}
      className="font-display text-center text-2xl font-bold tracking-[-0.02em] text-black drop-shadow-sm dark:text-white dark:bg-gray-900 md:text-5xl md:leading-[5rem]"
    />
  );
}
