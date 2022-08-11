import { createView, Ref, ref, reactive, ToRefs, JSXElement } from "../../../dist";

const app = document.querySelector<HTMLDivElement>("#app") as HTMLDivElement;

export type FC<T extends object> = (props: ToRefs<T> & { children?: any }) => JSXElement;

export interface AppProps {
  a: number;
}

const App: FC<AppProps> = ({ a, children }) => {
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
        App obj style
      </p>
      Hello {a.value}
      <ul>
        <li>{a.value}</li>
        <li
          class={{
            blue: a.value % 2 === 0,
            "bg-red": a.value % 2 === 0,
          }}
        >
          object class
        </li>
        <li class={["blue", a.value % 2 === 0 ? "bg-orange" : null]}>array class</li>
        <button onClick={() => a.value++}>Click a</button>
      </ul>
      {...children}
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

  return (
    <div>
      <p style={{ color: "green" }}>ASDASDASDASDAD</p>
      <button style={{ color: "red" }}>Click</button>
      <App a={a}>
        <ol>
          <li>child {a.value}</li>
          {/* <li>child {a.value}</li> */}
        </ol>
      </App>
      <button onClick={() => a.value++}>Click a</button>
      <p {...props}>spread props</p>
      <p class="red">String Literal Attribute</p>
      <button onClick={() => props.style.padding++}>+</button>
      <button onClick={() => props.style.padding--}>-</button>
    </div>
  );
};

const view = createView(<JSX />);

view.render(app);

const b = () => {
  console.log("b");
};

const symbol = Symbol("asd");
b[symbol] = 0;
console.log(b());
