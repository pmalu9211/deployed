import NumberTicker from "./number-ticker";

export function NumberTickerDemo() {
  return (
    <p className="whitespace-pre-wrap text-6xl font-medium tracking-tighter text-black dark:text-white">
      <NumberTicker direction="up" value={200} />
    </p>
  );
}
