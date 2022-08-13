import { createView, ref, reactive, JSXElement } from "../../../dist";
import { Counter } from "./Counter";

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
        <button class="btn" onClick={() => props.a++}>
          Click a
        </button>
      </ul>
      {children}
    </>
  );
};

const JSX = () => {
  const a = ref(0);
  const message = ref("Hello");
  const props = reactive({
    class: "red",
    style: {
      padding: 5,
    },
  });

  return (
    <div>
      <p style={{ color: "green" }}>ASDASDASDASDAD</p>
      <button style={{ color: "red" }}>Click</button>
      <Counter count={a.value} increment={() => a.value++} decrement={() => a.value--} />
      <App a={a.value} message="sample" styles={props}>
        <ol style={{ display: a.value % 2 == 0 ? "none" : "inline" }}>
          <li>child {a}</li>
          <li>child {a.value}</li>
        </ol>
      </App>
      {<div>123</div>}
      <button
        class="btn"
        onClick={() => {
          a.value++;
        }}
      >
        Click a
      </button>
      <p {...props}>spread props</p>
      <p class="red">String Literal Attribute</p>
      <p>{message}</p>
      <input
        class="border-2 m-2"
        value={message}
        // onInput={(e) => (message.value = e.target.value)}
        onInput={
          a.value % 2 === 0
            ? (e) => {
                message.value += e.target.value.slice(0, 1);
              }
            : (e) => {
                message.value = e.target.value;
              }
        }
      />
      <button class="btn" onClick={() => (props.style.padding += 2)}>
        +
      </button>
      <button class="btn" onClick={() => (props.style.padding -= 2)}>
        -
      </button>
    </div>
  );
};

const view = createView(<JSX />);
view.render(app);
