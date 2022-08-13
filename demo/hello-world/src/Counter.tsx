import { computed, effect } from "../../../dist";
import { FC } from "./main";

export interface CounterProps {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const Counter: FC<CounterProps> = (props) => {
  const power = computed(() => props.count ** 2);

  effect(() => {
    if (props.count % 2 === 0) {
      console.log("even");
    } else {
      console.log("odd");
    }
  });

  return (
    <div class="m-3 flex-row justify-center">
      <div
        class={[
          "text-2xl",
          "font-medium",
          "text-center",
          "transition-all",
          "mb-2 p-2",
          props.count % 2 == 0 ? "bg-teal-400" : undefined,
        ]}
      >
        <p>Power: {power}</p>
        <p>Count: {props.count}</p>
      </div>
      <div class="flex justify-center space-x-3">
        <button class="btn" onClick={props.increment}>
          +
        </button>
        <button class="btn" onClick={props.decrement}>
          -
        </button>
      </div>
    </div>
  );
};
