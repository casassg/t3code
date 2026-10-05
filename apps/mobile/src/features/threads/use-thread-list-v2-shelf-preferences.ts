import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import type { EnvironmentThreadShell } from "@t3tools/client-runtime/state/shell";
import type { EnvironmentId } from "@t3tools/contracts";
import { useCallback, useMemo, useRef } from "react";

import { mobilePreferencesAtom, updateMobilePreferencesAtom } from "../../state/preferences";
import { groupThreadsBySection } from "./threadOrder";

/** Alphabetical names of sections that at least one thread carries. The array
    keeps its identity until the names change, so rows can take it as a prop. */
export function useThreadSectionNames(
  threads: readonly EnvironmentThreadShell[],
  sectionEnvironmentIds: ReadonlySet<EnvironmentId>,
) {
  const names = useMemo(
    () =>
      groupThreadsBySection(
        threads.filter((thread) => thread.archivedAt === null),
        sectionEnvironmentIds,
      ).flatMap((group) => (group.label === null ? [] : [group.label])),
    [threads, sectionEnvironmentIds],
  );
  const stable = useRef(names);
  if (stable.current.length !== names.length || stable.current.some((n, i) => n !== names[i])) {
    stable.current = names;
  }
  return stable.current;
}

/**
 * Shared persisted shelf state for the compact Home list and iPad sidebar.
 * Refs advance before persistence starts so consecutive presses always toggle
 * the latest value, even if React has not rendered the optimistic patch yet.
 */
export function useThreadListV2ShelfPreferences() {
  const preferencesResult = useAtomValue(mobilePreferencesAtom);
  const savePreferences = useAtomSet(updateMobilePreferencesAtom);
  const loaded = AsyncResult.isSuccess(preferencesResult);
  const snoozedShelfExpanded =
    loaded && preferencesResult.value.threadListSnoozedShelfExpanded === true;
  const settledShelfExpanded =
    loaded && preferencesResult.value.threadListSettledShelfExpanded === true;
  // Working section beta: off until the preference loads and is enabled.
  const workingShelfEnabled = loaded && preferencesResult.value.workingShelfEnabled === true;
  const workingShelfExpanded =
    loaded && preferencesResult.value.threadListWorkingShelfExpanded === true;
  const savedCollapsedSections = loaded
    ? preferencesResult.value.threadListCollapsedSections
    : undefined;
  const collapsedSections = useMemo(
    () => new Set(savedCollapsedSections ?? []),
    [savedCollapsedSections],
  );
  const collapsedSectionsRef = useRef(collapsedSections);
  collapsedSectionsRef.current = collapsedSections;
  const snoozedShelfExpandedRef = useRef(snoozedShelfExpanded);
  const settledShelfExpandedRef = useRef(settledShelfExpanded);
  const workingShelfExpandedRef = useRef(workingShelfExpanded);
  snoozedShelfExpandedRef.current = snoozedShelfExpanded;
  settledShelfExpandedRef.current = settledShelfExpanded;
  workingShelfExpandedRef.current = workingShelfExpanded;

  const toggleSnoozedShelf = useCallback(() => {
    if (!loaded) return;
    const expanded = !snoozedShelfExpandedRef.current;
    snoozedShelfExpandedRef.current = expanded;
    savePreferences({ threadListSnoozedShelfExpanded: expanded });
  }, [loaded, savePreferences]);
  const toggleSettledShelf = useCallback(() => {
    if (!loaded) return;
    const expanded = !settledShelfExpandedRef.current;
    settledShelfExpandedRef.current = expanded;
    savePreferences({ threadListSettledShelfExpanded: expanded });
  }, [loaded, savePreferences]);
  const toggleWorkingShelf = useCallback(() => {
    if (!loaded) return;
    const expanded = !workingShelfExpandedRef.current;
    workingShelfExpandedRef.current = expanded;
    savePreferences({ threadListWorkingShelfExpanded: expanded });
  }, [loaded, savePreferences]);
  const toggleSection = useCallback(
    (name: string) => {
      if (!loaded) return;
      const next = new Set(collapsedSectionsRef.current);
      if (!next.delete(name)) next.add(name);
      collapsedSectionsRef.current = next;
      savePreferences({ threadListCollapsedSections: [...next] });
    },
    [loaded, savePreferences],
  );

  return {
    loaded,
    collapsedSections,
    settledShelfExpanded,
    snoozedShelfExpanded,
    workingShelfEnabled,
    workingShelfExpanded,
    toggleSettledShelf,
    toggleSnoozedShelf,
    toggleWorkingShelf,
    toggleSection,
  } as const;
}
