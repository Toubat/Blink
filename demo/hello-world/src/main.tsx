import { createView, effect, Ref, ref } from "../../../dist";
import { VNodeCreator } from "../../../dist/runtime-core/vnode";

const app = document.querySelector<HTMLDivElement>("#app")!;

const a = ref(111);

export type FC<T extends object> = (props: T & { children?: any }) => VNodeCreator;

export interface AppProps {
  a: Ref<number>;
}

const App: FC<AppProps> = ({ a: data, children }) => {
  return (
    <>
      <p style="color: red">App</p>
      Hello {data.value}
      <ul>
        <li>{data}</li>
        {() => {
          const c = ref(222);
          return data.value === 133 ? <li>133</li> : <li>{c.value}</li>;
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
        <li>child 1</li>
        <li>child 2</li>
        <li>child {a.value}</li>
      </ol>
      <ol>
        <li>child 1</li>
        <li>child 2</li>
        <li>child {a.value}</li>
      </ol>
    </App>
  </>
);

effect(() => {
  const view = createView(<JSX />);

  view.render(app);
});

setTimeout(() => {
  a.value = 133;
}, 1000);

const b = () => {
  console.log("b");
};
const symbol = Symbol("asd");
b[symbol] = 0;
console.log(b());
