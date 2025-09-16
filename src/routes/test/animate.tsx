import { useState } from "react";
import "./animate.css";

export default function TestOverlap() {
  const [items, setItems] = useState<Array<string>>(["predef1", "predef2"]);

  return (
    <>
      <h1>Animation testing</h1>
      <button onClick={() => setItems(i => ["item" + i.length, ...i])}>add</button>
      <ul>
        {items.map(i => <li className="color-degrading" key={i}>{i}</li>)}
      </ul>
    </>
  );
}
