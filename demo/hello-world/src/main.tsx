import { createView, effect, Ref, ref, r } from "../../../dist";
import { JSXElement } from "../../../dist/runtime-core/vnode";

const app = document.querySelector<HTMLDivElement>("#app") as HTMLDivElement;

const a = ref(111);

export type FC<T extends object> = (props: T & { children?: any }) => JSXElement;

export interface AppProps {
  a: Ref<number>;
}

const c = ref("green");

const App: FC<AppProps> = ({ a: data, children }) => {
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
        App obj style
      </p>
      Hello {data.value}
      <ul>
        <li>{data.value}</li>
        <li
          class={{
            blue: a.value % 2 === 0,
            "bg-red": a.value % 2 === 0,
          }}
        >
          object class
        </li>
        <li class={["blue", a.value % 2 === 0 ? "bg-orange" : null]}>array class</li>
        <button onClick={() => a.value++}>Click</button>
      </ul>
      {...children}
    </>
  );
};

const JSX = () => (
  <div>
    <p style="color: green">ASDASDASDASDAD</p>
    {"JSX element"}
    {1 + 1}
    <App a={a}>
      <ol>
        <li>child {a.value}</li>
      </ol>
      <ol>
        <li>child {a.value}</li>
      </ol>
    </App>
  </div>
);

const view = createView(<JSX />);

view.render(app);

setTimeout(() => {
  c.value = "blue";
}, 1000);

const b = () => {
  console.log("b");
};

const symbol = Symbol("asd");
b[symbol] = 0;
console.log(b());
