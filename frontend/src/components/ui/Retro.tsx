import { useNavigate } from "react-router-dom";
import RetroGrid from "./retro-grid";

export function RetroGridDemo() {
  const navigate = useNavigate();
  return (
    <div className="relative flex h-[90vh] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
      <div className="pointer-events-none z-10 whitespace-pre-wrap  bg-clip-text text-center text-9xl font-extrabold leading-none tracking-tighter  text-gray-200">
        Deploy It
      </div>
      <div className="pointer-events-none z-10 whitespace-pre-wrap  bg-clip-text text-center text-2xl font-medium leading-none tracking-tighter text-white mt-8">
        A platform for deploying your apps securely
      </div>
      <button
        className="z-10 mt-10 cursor-pointer rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-xl font-medium text-white shadow-lg transition-transform hover:scale-105 hover:shadow-2xl active:scale-95"
        onClick={() => {
          navigate("/home");
        }}
      >
        Get Started
      </button>
      <RetroGrid />
    </div>
  );
}
