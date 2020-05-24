import { render } from 'solid-js/dom';

function App() {
  return <h1>Hello, world.</h1>;
}

// We can't inject the app directly into body
// due to the rendering errors that causes with solid.
const root = document.createElement('main');
document.body.appendChild(root);
render(App, root);
