import { Link } from "react-router-dom";

export default function ListTestExamples() {
  return (
    <>
      <h1 className="text-lg font-semibold">Test examples</h1>
      <ul>
        <li>
          <Link to="./log-list">Log list</Link>
        </li>

        <li>
          <Link to="./log-list-6h">Log list fetched 6h</Link>
        </li>

        <Link to="./test-rule-section">
          <li>Rule section</li>
        </Link>

        <Link to="./animate">
          <li>Animate</li>
        </Link>

        <Link to="./test-overlap">
          <li>Overlap</li>
        </Link>
      </ul>
    </>
  );
}
