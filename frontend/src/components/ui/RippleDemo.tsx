import { NumberTickerDemo } from "./NumberTrick";
import Ripple from "./ripple";

export function RippleDemo() {
  return (
    <div className="relative h-[200vh] w-full overflow-hidden bg-black">
      <div className="absolute bottom-0 left-0 w-full flex items-center justify-center h-[100vh]">
        <p className="z-10 whitespace-pre-wrap text-center text-4xl text-white">
          <NumberTickerDemo />
          <span className="poppins-font font-normal block">Seconds</span>
        </p>
        <Ripple />
      </div>
    </div>
  );
}
