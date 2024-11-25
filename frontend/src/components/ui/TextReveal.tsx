import TextRevealByWord from "./text-reveal";
interface SetState {
  setSkipHome: React.Dispatch<React.SetStateAction<boolean>>;
}

export function TextRevealDemo({ setSkipHome }: SetState) {
  return (
    <div className="h-[200vh] flex items-center justify-center bg-white dark:bg-black">
      <TextRevealByWord
        setSkipHome={setSkipHome}
        text="From localhost to liftoff 🚀 — your site's live in just"
      />
    </div>
  );
}
