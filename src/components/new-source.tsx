import { Button, buttonVariantSizes, buttonVariantVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createNewSource } from "@/data/redux/sourcesSlice";
import { SourceMutation } from "@/data/source";
import { useState } from "react";
import { useDispatch } from "react-redux";

export function NewSource(
  props: {
    preOpen?: boolean;
    buttonText?: string;
    buttonVariant?: keyof typeof buttonVariantVariants;
    buttonSize?: keyof typeof buttonVariantSizes;
  },
) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(props.preOpen);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submission = Object.fromEntries(new FormData(event.currentTarget)) as SourceMutation;
    dispatch(createNewSource({ source: submission }));
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          data-testid="new-source-button"
          size={props.buttonSize || "sm"}
          variant={props.buttonVariant ?? "ghost"}
        >
          {props.buttonText ?? "New Source"}
        </Button>
      </SheetTrigger>
      <SheetContent data-testid="new-source-sheet" className="w-1/2">
        <SheetHeader>
          <SheetTitle>New Source</SheetTitle>
          <SheetDescription>Define a new Loki source to start consuming data from</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-8 items-center gap-2">
              <div className="col-span-7">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="col-span-1">
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" type="color" required />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="query">Loki query</Label>
              <Textarea id="query" name="query" className="col-span-4" rows={6} required />
            </div>
          </div>
          <SheetFooter>
            <Button data-testid="save-source-button" type="submit">Save changes</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
