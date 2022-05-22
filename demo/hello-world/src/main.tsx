import { createView, effect, Ref, ref, r } from "../../../dist";
import { JSXElement } from "../../../dist/runtime-core/vnode";

const app = document.querySelector<HTMLDivElement>("#app")!;

const a = ref(111);

export type FC<T extends object> = (props: T & { children?: any }) => JSXElement;

export interface AppProps {
  a: Ref<number>;
}

const c = ref(222);

const App: FC<AppProps> = ({ a: data, children }) => {
  return (
    <>
      <p style="color: red">App</p>
      <p
        style={{
          color: "green",
        }}
      >
        App obj style
      </p>
      Hello {data.value}
      <ul>
        <li>{data}</li>
        <li
          class={{
            blue: r(() => a.value === 133),
            "bg-red": r(() => a.value === 133),
          }}
        >
          object class
        </li>
        <li class={["blue", "bg-red"]}>array class</li>
        {() => {
          return r(() =>
            data.value === 133 ? (
              <li class="blue">data.value === 133</li>
            ) : (
              <li class="yellow">data.value === {c.value}</li>
            )
          );
        }}
      </ul>
      {...children}
    </>
  );
};

const JSX = () => (
  <>
    <p style="color: green">ASDASDASDASDAD</p>
    JSX element
    <App a={a}>
      <ol>
        <li>child {a.value}</li>
        {r(() => a.value + 1000)}
      </ol>
      <ol>
        <li>child {a.value}</li>
      </ol>
    </App>
  </>
);

const view = createView(<JSX />);

view.render(app);

setTimeout(() => {
  a.value = 133;
}, 1000);

const b = () => {
  console.log("b");
};
const symbol = Symbol("asd");
b[symbol] = 0;
console.log(b());
