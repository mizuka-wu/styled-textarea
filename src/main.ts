import "./style.css";
import StyledTextarea from "./src";
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";

// 注册自定义元素
customElements.define("styled-textarea", StyledTextarea);

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Styled Textarea Demo</h1>
    <div class="card">
      <div class="demo-container">
        <div class="editor-panel">
          <div id="textarea"></div>
          <div class="button-group"></div>
        </div>
        <div class="info-panel">
          <textarea class="native-textarea" readonly></textarea>
          <pre class="marks-info"></pre>
        </div>
      </div>
    </div>
  </div>
`;

// 添加样式
const style = document.createElement('style');
style.textContent = `
  .demo-container {
    display: flex;
    gap: 20px;
    margin-top: 20px;
  }
  .editor-panel, .info-panel {
    flex: 1;
  }
  .button-group {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
  }
  .button-group button {
    padding: 6px 12px;
    border-radius: 4px;
    border: 1px solid #646cff;
    background: transparent;
    color: #646cff;
    cursor: pointer;
    transition: all 0.2s;
  }
  .button-group button:hover {
    background: #646cff;
    color: white;
  }
  .native-textarea {
    width: 100%;
    height: 100px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 12px;
    font-family: inherit;
    resize: none;
  }
  .marks-info {
    margin: 0;
    padding: 0;
    text-align: left;
    font-size: 14px;
    max-height: 200px;
    overflow: auto;
  }
`;
document.head.appendChild(style);

// 获取容器元素
const textarea = document.createElement("styled-textarea") as StyledTextarea;
document.querySelector("#textarea")!.appendChild(textarea);

const buttonGroup = document.querySelector(".button-group")!;
const nativeTextarea = document.querySelector(".native-textarea") as HTMLTextAreaElement;
const marksInfo = document.querySelector(".marks-info")!;

// 更新函数
const updateInfo = () => {
  nativeTextarea.value = textarea.value;
  const { from, to } = textarea.selection;
  const marks = textarea.getMarks(from);
  marksInfo.textContent = JSON.stringify({ selection: { from, to }, marks }, null, 2);
};

// 添加按钮
const buttons = [
  {
    text: "添加红色加粗",
    onClick: () => {
      const { from, to } = textarea.selection;
      textarea.addMarks(from, [{
        type: "customStyle",
        attrs: {
          css: "color: red; font-weight: bold;",
          className: "highlight"
        }
      }], to - from);
      updateInfo();
    }
  },
  {
    text: "添加背景色",
    onClick: () => {
      const { from, to } = textarea.selection;
      textarea.addMarks(from, [{
        type: "customStyle",
        attrs: {
          css: "background: #f0f8ff;",
          className: "bg-highlight"
        }
      }], to - from);
      updateInfo();
    }
  },
  {
    text: "添加下划线",
    onClick: () => {
      const { from, to } = textarea.selection;
      textarea.addMarks(from, [{
        type: "customStyle",
        attrs: {
          css: "text-decoration: underline;",
          className: "underline"
        }
      }], to - from);
      updateInfo();
    }
  },
  {
    text: "移除所有样式",
    onClick: () => {
      textarea.removeMarks(0);
      updateInfo();
    }
  },
  {
    text: "移除红色样式",
    onClick: () => {
      textarea.removeMarks(0, undefined, ["customStyle"]);
      updateInfo();
    }
  }
];

buttons.forEach(({ text, onClick }) => {
  const button = document.createElement("button");
  button.textContent = text;
  button.onclick = onClick;
  buttonGroup.appendChild(button);
});

// 监听事件
textarea.addEventListener("input", updateInfo);
textarea.addEventListener("keyup", updateInfo);
textarea.addEventListener("mouseup", updateInfo);

// 设置初始文本
textarea.value = "这是一个支持样式设置的编辑器组件";
updateInfo();
