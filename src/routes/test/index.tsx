import { Link } from "react-router-dom";

export default function ListTestExamples() {
  return (
    <>
      <h2>Test examples</h2>
      <ul>
        <li>
          <Link to="./log-list">Log list</Link>
        </li>

        <Link to="./test-rule-section">
          <li>Rule section</li>
        </Link>
        <Link to="./test-overlap">
          <li>Overlap</li>
        </Link>
      </ul>
    </>
  );
}
