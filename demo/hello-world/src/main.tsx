import {
  createView,
  ref,
  reactive,
  JSXElement,
  createJSXElement,
  computed,
  effect,
} from "../../../dist";

const app = document.querySelector<HTMLDivElement>("#app") as HTMLDivElement;

export interface AppProps {
  a: number;
  message: string;
  styles: {
    class: string;
    style: {
      [key: string]: any;
    };
  };
}

export type FC<T extends object = any> = {
  (props: T, context: { children?: any }): JSXElement;
};

const App: FC<AppProps> = (props, { children }) => {
  const c = ref("green");

  setTimeout(() => {
    c.value = "blue";
  }, 1000);

  return (
    <>
      <p
        {...{
          style: "color: orange",
        }}
      >
        App
      </p>
      <p
        style={{
          color: c.value,
        }}
      >
        App obj style {props.message}
      </p>
      Hello {props.a}
      <ul>
        <li {...props.styles}> --- {props.a} --- </li>
        <li
          class={{
            blue: props.a % 2 === 0,
            "bg-red": props.a % 2 === 0,
          }}
        >
          object class
        </li>
        <li class={["blue", props.a % 2 === 0 ? "bg-orange" : null]}>array class</li>
        <button onClick={() => props.a++}>Click a</button>
      </ul>
      {children}
    </>
  );
};

const JSX = () => {
  const a = ref(111);
  const props = reactive({
    class: "red",
    style: {
      padding: 5,
    },
  });

  createJSXElement("li", {
    class: ["blue", true],
  });

  return (
    <div>
      <p style={{ color: "green" }}>ASDASDASDASDAD</p>
      <button style={{ color: "red" }}>Click</button>
      <App a={a.value} message="sample" styles={props}>
        <ol>
          <li>child {a.value}</li>
          <li>child {a.value}</li>
        </ol>
      </App>
      <button
        onClick={() => {
          a.value++;
        }}
      >
        Click a
      </button>
      <p {...props}>spread props</p>
      <p class="red">String Literal Attribute</p>
      <button onClick={() => (props.style.padding += 2)}>+</button>
      <button onClick={() => (props.style.padding -= 2)}>-</button>
      {[1, 2, 3].map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
};

const Counter = () => {
  const count = ref(0);
  const power = computed(() => count.value ** 2);

  effect(() => {
    if (count.value % 2 === 0) {
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
          count.value % 2 == 0 ? "bg-teal-400" : undefined,
        ]}
      >
        <p>Power: {power.value}</p>
        <p>Count: {count.value}</p>
      </div>
      <div class="flex justify-center space-x-3">
        <button class="btn" onClick={() => count.value++}>
          +
        </button>
        <button class="btn" onClick={() => count.value--}>
          -
        </button>
      </div>
    </div>
  );
};

const view = createView(<Counter />);
view.render(app);
