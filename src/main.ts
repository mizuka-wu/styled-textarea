import "./style.css";
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { StyledTextarea } from "./src/index";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <div id="textarea"></div>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

customElements.define("styled-textarea", StyledTextarea);
const container = document.getElementById("textarea")!;
container.appendChild(document.createElement("styled-textarea"));

const textarea = container.querySelector("styled-textarea")! as StyledTextarea;
textarea.value = "Hello, world!";
textarea.focus();

textarea.onchange = (e) => {
  console.log(e);
};
