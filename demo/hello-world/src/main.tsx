import { reactive, effect, createView } from '../../../dist';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

const a = reactive({ foo: 1 });

const App = (
  <div>
    <p>ASDASDASDASDAD</p>
    Hello
    <ul>
      <li>1</li>
      <li>2</li>
      <li>3</li>
    </ul>
  </div>
);

const view = createView(App);

view.render(app);
