import { reactive, effect, createView, ref } from "../../../dist";

const app = document.querySelector<HTMLDivElement>("#app")!;

const JSX = (
  <div>
    <p style="color: green">ASDASDASDASDAD</p>
    nested
  </div>
);

const App = () => {
  const data = ref(123);

  return (
    <div>
      <p style="color: red">ASDASDASDASDAD</p>
      Hello {data.value}
      <ul>
        <li>1</li>
        <li>2</li>
        <li>3</li>
      </ul>
      {JSX}
    </div>
  );
};

const view = createView(<App a={1} />);

view.render(app);
