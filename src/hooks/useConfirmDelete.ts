import { useState } from "react";

export function useConfirmDelete<T>() {
  const [target, setTarget] = useState<T | null>(null);

  function requestDelete(item: T) {
    setTarget(item);
  }

  function cancel() {
    setTarget(null);
  }

  function confirm(action: (item: T) => void) {
    if (target == null) return;
    action(target);
    setTarget(null);
  }

  return { target, isOpen: target != null, requestDelete, cancel, confirm };
}
