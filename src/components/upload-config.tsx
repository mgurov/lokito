import { UploadIcon } from '@radix-ui/react-icons';
import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { setAllSources } from '@/data/redux/sourcesSlice';
import { Source } from '@/data/source';
import { Alert, AlertTitle } from './ui/alert';
import { Filter } from '@/data/filters/filter';
import { createFilter } from '@/data/filters/filtersSlice';

function UploadConfig({ onConfigLoad }: { onConfigLoad: (config: {sources: Source[], filters: Filter[]}) => void }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (!e.dataTransfer.files || !e.dataTransfer.files[0]) {
        setUploadError('Not a single file dropped');
        return;
      }

      const file = e.dataTransfer.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          if (!event.target?.result || typeof event.target.result !== 'string') {              
            setUploadError('Could not read the file dropped');
            return;
          }
          let config: {sources: Source[], filters: Filter[]};
          try {
            config = JSON.parse(event.target.result);
          } catch (_error) {
            setUploadError('The file is not a valid JSON');
            return;
          }

          if (!config.sources || !config.filters) {
            setUploadError('Could not find sources or filters in the JSON uploaded');
            return;
          }

          onConfigLoad(config);
          toast.success('Successful 🎉🎉', {
            description: `${config.sources.length} sources and ${config.filters.length} filters have been loaded from file`,
          });
        } catch (error) {
          console.error(error);
          toast.error('Something went wrong', {
            description:
              'There was an issue loading the sources from the file. Please try again.',
          });
        }
      };

      reader.readAsText(file);
    },
    [onConfigLoad],
  );

  return (
    <>
      <div
        data-testid="upload-landing-zone"
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: '2px dashed #cccccc',
          borderRadius: '4px',
          padding: '40px',
          textAlign: 'center',
          color: '#333',
          background: isDragActive ? '#e6f7ff' : '#fafafa',
        }}
      >
        {isDragActive
          ? 'Drop the configuration file here'
          : 'Drag and drop your configuration file here'}
      </div>
      {uploadError && <Alert variant="destructive">
        <AlertTitle>Error processing configuration upload</AlertTitle>
        {uploadError}</Alert>}

    </>
  );
}

export function UploadSourcesConfiguration() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  function loadSources(config: {sources: Source[], filters: Filter[]}) {
    dispatch(setAllSources(config.sources));
    config.filters.forEach((filter) => {
      dispatch(createFilter(filter));
    });
    setIsOpen(false);
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button title="Upload configuration" variant="outline" size="icon">
          <UploadIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Load configuration</DialogTitle>
          <DialogDescription>Drag and Drop your configuration file to load it</DialogDescription>
        </DialogHeader>
        <UploadConfig onConfigLoad={loadSources} />
      </DialogContent>
    </Dialog>
  );
}
