import type {
  ModelSelection,
  ProviderDriverKind,
  ProviderInstanceId,
  RuntimeMode,
  ServerProvider,
} from "@t3tools/contracts";
import { createModelSelection } from "@t3tools/shared/model";
import { useEffect, useState } from "react";

import type { ProviderInstanceEntry } from "../../providerInstances";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../ui/select";
import type { ModelEsque } from "./providerIconUtils";
import { ProviderModelPicker } from "./ProviderModelPicker";
import { runtimeModeConfig, runtimeModeOptions } from "./runtimeModeConfig";
import { TraitsPicker } from "./TraitsPicker";

export interface ImplementPlanOverrides {
  readonly modelSelection: ModelSelection;
  readonly provider: ProviderDriverKind;
  readonly models: ReadonlyArray<ServerProvider["models"][number]>;
  readonly runtimeMode: RuntimeMode;
}

/** Lets the user pick the harness, model, traits and permissions for the implementation thread. */
export function ImplementPlanDialog({
  open,
  onOpenChange,
  initialSelection,
  initialRuntimeMode,
  instanceEntries,
  modelOptionsByInstance,
  planModeEnabled,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelection: ModelSelection;
  initialRuntimeMode: RuntimeMode;
  instanceEntries: ReadonlyArray<ProviderInstanceEntry>;
  modelOptionsByInstance: ReadonlyMap<ProviderInstanceId, ReadonlyArray<ModelEsque>>;
  planModeEnabled: boolean;
  onConfirm: (overrides: ImplementPlanOverrides) => void;
}) {
  const [selection, setSelection] = useState(initialSelection);
  const [runtimeMode, setRuntimeMode] = useState(initialRuntimeMode);

  useEffect(() => {
    if (!open) return;
    setSelection(initialSelection);
    setRuntimeMode(initialRuntimeMode);
    // Reset only when the dialog opens, not while the user edits.
  }, [open]);

  const entry = instanceEntries.find((candidate) => candidate.instanceId === selection.instanceId);
  const RuntimeIcon = runtimeModeConfig[runtimeMode].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Implement in a new thread</DialogTitle>
          <DialogDescription>
            Choose the harness, model, and permissions for the implementation thread.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <ProviderModelPicker
                activeInstanceId={selection.instanceId}
                model={selection.model}
                lockedProvider={null}
                instanceEntries={instanceEntries}
                modelOptionsByInstance={modelOptionsByInstance}
                onInstanceModelChange={(instanceId, model) =>
                  setSelection(createModelSelection(instanceId, model))
                }
              />
              {entry ? (
                <TraitsPicker
                  provider={entry.driverKind}
                  instanceId={selection.instanceId}
                  models={entry.models}
                  model={selection.model}
                  prompt=""
                  onPromptChange={() => {}}
                  modelOptions={selection.options ?? []}
                  allowPromptInjectedEffort={false}
                  planModeEnabled={planModeEnabled}
                  onModelOptionsChange={(options) =>
                    setSelection(
                      createModelSelection(selection.instanceId, selection.model, options),
                    )
                  }
                />
              ) : null}
            </div>
            <Select value={runtimeMode} onValueChange={(value) => value && setRuntimeMode(value)}>
              <SelectTrigger size="sm" aria-label="Permissions">
                <RuntimeIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <SelectValue>{runtimeModeConfig[runtimeMode].label}</SelectValue>
              </SelectTrigger>
              <SelectPopup alignItemWithTrigger={false}>
                {runtimeModeOptions.map((mode) => (
                  <SelectItem key={mode} value={mode} className="min-w-64">
                    <div className="grid gap-0.5">
                      <span className="font-medium">{runtimeModeConfig[mode].label}</span>
                      <span className="text-xs leading-4 text-muted-foreground">
                        {runtimeModeConfig[mode].description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!entry}
            onClick={() => {
              if (!entry) return;
              onOpenChange(false);
              onConfirm({
                modelSelection: selection,
                provider: entry.driverKind,
                models: entry.models,
                runtimeMode,
              });
            }}
          >
            Implement
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
