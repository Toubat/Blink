import { createView, effect, ref } from "../../../dist";

const app = document.querySelector<HTMLDivElement>("#app")!;

const a = ref(111);

const App = ({ a: data }) => {
  return (
    <div>
      <p style="color: red">ASDASDASDASDAD</p>
      Hello {data.value}
      <ul>
        <li>{data}</li>
        {() => (data.value === 133 ? <li>133</li> : "Not 133")}
      </ul>
    </div>
  );
};

const JSX = (
  <div>
    <p style="color: green">ASDASDASDASDAD</p>
    nested
    <App a={a} />
  </div>
);

effect(() => {
  const view = createView(JSX);

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
