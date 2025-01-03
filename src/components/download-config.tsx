import { DownloadIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { useSources } from '@/data/redux/sourcesSlice';
import { useFilters } from '@/data/filters/filtersSlice';

function downloadConfig(config: unknown, filename: string) {
  const jsonString = JSON.stringify(config, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function DownloadSourcesConfiguration() {
  const sources = useSources();
  const filters = useFilters();
  function handleDownload() {
    const fileName = `lokito-config-${new Date().toISOString()}.json`;
    downloadConfig({sources, filters}, fileName);
  }

  return (
    <Button
      title="Download configuration"
      onClick={handleDownload}
      disabled={sources.length === 0 && filters.length === 0}
      variant="outline"
      size="icon"
    >
      <DownloadIcon />
    </Button>
  );
}
