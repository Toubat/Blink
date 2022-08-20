import { NOOP } from "../shared";

let mountedCallback: VoidFunction = NOOP;

export function mounted(callback: VoidFunction) {
  mountedCallback = callback;
}

export function getMountedCallback(): VoidFunction {
  return mountedCallback;
}

export function finishMount() {
  mountedCallback = NOOP;
}
