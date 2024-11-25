import Footer from "@/components/Footer";
import { RetroGridDemo } from "@/components/ui/Retro";
import { RippleDemo } from "@/components/ui/RippleDemo";
import { TextRevealDemo } from "@/components/ui/TextReveal";
import { ScrollBasedVelocityDemo } from "@/components/ui/VelocityBasedScorll";

interface setState {
  setSkipHome: React.Dispatch<React.SetStateAction<boolean>>;
}

const LandingPage = ({ setSkipHome }: setState) => {
  return (
    <>
      <RetroGridDemo setSkipHome={setSkipHome} />
      <ScrollBasedVelocityDemo />
      <div className="flex h-full ">
        <div className="flex-1 flex items-center justify-center">
          <TextRevealDemo setSkipHome={setSkipHome} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <RippleDemo />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LandingPage;
