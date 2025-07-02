export default function testOverlap() {
  return (
    <>
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
    </>
  );
}
