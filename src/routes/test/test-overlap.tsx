import { Button } from "@/components/ui/shadcn/button";
import { useState } from "react";

export default function testOverlap() {
  return (
    <>
      <h4>Flexes and blocks</h4>
      <div className="flex">
        <span>Blah flah</span>
        <div className="inline-block">
          <span className="w-[3ch] border bg-red-100"></span>
          <span className="absolute inline-block w-[3ch] overflow-hidden whitespace-nowrap border z-10 bg-gray-100
                    interpolate-keywords-size hover:w-max transition-[width] ease-in-out duration-300 delay-700
                ">
            Hello, this is a longer text!
          </span>
        </div>
        <span className="ml-1">Other content</span>
      </div>
      <hr />
      <h4>Button with progress</h4>
      <p>
        Here goes a <Button>normal button</Button> and an <EnhancedButton>enhanced one</EnhancedButton>.
      </p>
    </>
  );
}

function EnhancedButton({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<number>(50);

  const lineStyle = {
    width: progress + "%",
  };

  return (
    <Button
      className="relative"
      onClick={() =>
        setProgress(p => {
          if (p >= 100) {
            return 0;
          } else {
            return p + 25;
          }
        })}
    >
      {children}
      <div style={lineStyle} className="bg-red-500 absolute left-0 right-0 bottom-[5px] h-1 transition-all"></div>
    </Button>
  );
}
