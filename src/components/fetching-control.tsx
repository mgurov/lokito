import { Button } from './ui/button';
import { Link } from 'react-router-dom';


export function FetchingControl() {
  return (
    <div className="flex justify-end gap-2 mb-1">


      <Button data-testid="sources-button" size="sm" variant="secondary" asChild>
        <Link to="/sources">
          Sources
        </Link>
      </Button>

    </div>
  );
}
