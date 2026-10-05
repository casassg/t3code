import { useEffect, useId, useState } from "react";
import { create } from "zustand";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
} from "./ui/dialog";

const MAX_THREAD_SECTION_NAME_LENGTH = 64;

type Request = { readonly resolve: (name: string | null) => void };
const useRequest = create<{ request: Request | null }>(() => ({ request: null }));

export function requestThreadSectionName(): Promise<string | null> {
  useRequest.getState().request?.resolve(null);
  return new Promise((resolve) => useRequest.setState({ request: { resolve } }));
}

function finish(name: string | null) {
  const request = useRequest.getState().request;
  useRequest.setState({ request: null });
  request?.resolve(name);
}

export function ThreadSectionDialogHost() {
  const request = useRequest((state) => state.request);
  useEffect(() => () => finish(null), []);
  return request ? <ThreadSectionDialog /> : null;
}

function ThreadSectionDialog() {
  const id = useId();
  const [name, setName] = useState("");
  const trimmed = name.trim();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) finish(null);
      }}
    >
      <DialogPopup className="sm:max-w-sm">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed.length > 0) finish(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>New section</DialogTitle>
            <DialogDescription>
              Threads in a section are grouped together in the sidebar inbox.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <Label className="flex flex-col items-stretch" htmlFor={id}>
              Name
              <Input
                nativeInput
                autoFocus
                id={id}
                maxLength={MAX_THREAD_SECTION_NAME_LENGTH}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Label>
          </DialogPanel>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => finish(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={trimmed.length === 0}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
