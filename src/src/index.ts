import { Schema } from "prosemirror-model";
import { EditorState, TextSelection, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  baseKeymap,
  chainCommands,
  deleteSelection,
  joinBackward,
  selectNodeBackward,
} from "prosemirror-commands";

export class StyledTextarea extends HTMLElement {
  private _schema: Schema;
  private editor: EditorView | null = null;

  static get observedAttributes() {
    return ["value", "readonly"];
  }

  constructor() {
    super();
    this._schema = this._createSchema();
    this.attachShadow({ mode: "open" });
    this._initEditor();
    this._setupStyles();
  }

  _createSchema() {
    return new Schema({
      nodes: {
        doc: { content: "paragraph+" },
        paragraph: {
          content: "text*",
          toDOM: () => ["p", { class: "styled-textarea-paragraph" }, 0],
          parseDOM: [{ tag: "p" }],
        },
        text: { inline: true },
      },
      marks: {
        link: {
          attrs: {
            href: { default: "" },
            editMode: { default: false },
          },
          toDOM: (node) => {
            const isEditable =
              this.editor!.props.editable!(this.editor!.state) ?? true;
            return [
              isEditable ? "span" : "a",
              {
                class: "styled-textarea-link",
                href: node.attrs.href,
                target: isEditable ? null : "_blank",
                style: isEditable
                  ? "cursor: text; pointer-events: none;"
                  : "cursor: pointer;",
              },
              0,
            ];
          },
          parseDOM: [
            {
              tag: "a.styled-textarea-link, span.styled-textarea-link",
              getAttrs: (dom) => ({
                href: dom.getAttribute("href") || "",
                editMode: dom.tagName.toLowerCase() === "span",
              }),
            },
          ],
        },
      },
    });
  }

  _initEditor() {
    this.editor = new EditorView(this.shadowRoot, {
      state: EditorState.create({
        doc: this._schema.node("doc", null, [
          this._schema.node(
            "paragraph",
            null,
            this.value ? this._schema.text(this.value) : []
          ),
        ]),
        plugins: [
          new Plugin({
            props: {
              handleKeyDown: (view, event) => {
                const keyEvent = new KeyboardEvent("keydown", {
                  key: event.key,
                  code: event.code,
                  location: event.location,
                  ctrlKey: event.ctrlKey,
                  shiftKey: event.shiftKey,
                  altKey: event.altKey,
                  metaKey: event.metaKey,
                  repeat: event.repeat,
                  isComposing: event.isComposing,
                  charCode: event.charCode,
                  keyCode: event.keyCode,
                  bubbles: true,
                  cancelable: true,
                  composed: true,
                });

                Object.defineProperty(keyEvent, "target", {
                  writable: false,
                  value: this,
                });

                const prevented = !this.dispatchEvent(keyEvent);

                if (prevented) {
                  event.preventDefault();
                  return true;
                }

                // 使用 baseKeymap 中的命令
                if (baseKeymap[event.key]) {
                  // 对于 Backspace 键，我们使用自定义的链式命令
                  if (event.key === "Backspace") {
                    const command = chainCommands(
                      deleteSelection, // 首先尝试删除选中内容
                      joinBackward, // 如果在段落开头，则与上一段落合并
                      selectNodeBackward // 如果以上都失败，选中前一个节点
                    );
                    if (command(view.state, view.dispatch, view)) {
                      return true;
                    }
                  }

                  // 对于其他键，使用 baseKeymap 中的默认命令
                  const command = baseKeymap[event.key];
                  if (command(view.state, view.dispatch, view)) {
                    return true;
                  }
                }

                // 处理特殊按键
                const { $from, $to } = view.state.selection;
                const pos = $from.pos;

                switch (event.key) {
                  case "Enter":
                    // 在当前位置插入新段落
                    const tr = view.state.tr.split(pos);
                    view.dispatch(tr);
                    return true;

                  case "ArrowUp":
                    if ($from.pos === 0) {
                      // 在文档开头时阻止向上移动
                      return true;
                    }
                    return false;

                  case "ArrowDown":
                    if ($to.pos === view.state.doc.content.size) {
                      // 在文档末尾时阻止向下移动
                      return true;
                    }
                    return false;

                  default:
                    return false;
                }
              },
              handleKeyPress: (view, event) => {
                const keyEvent = new KeyboardEvent("keypress", {
                  key: event.key,
                  code: event.code,
                  location: event.location,
                  ctrlKey: event.ctrlKey,
                  shiftKey: event.shiftKey,
                  altKey: event.altKey,
                  metaKey: event.metaKey,
                  repeat: event.repeat,
                  isComposing: event.isComposing,
                  charCode: event.charCode,
                  keyCode: event.keyCode,
                  bubbles: true,
                  cancelable: true,
                  composed: true,
                });

                Object.defineProperty(keyEvent, "target", {
                  writable: false,
                  value: this,
                });

                const prevented = !this.dispatchEvent(keyEvent);
                if (prevented) {
                  event.preventDefault();
                  return true;
                }

                return false;
              },
            },
          }),
          new Plugin({
            view: () => ({
              update: (view: EditorView, prevState) => {
                if (!view.state.doc.eq(prevState.doc)) {
                  const inputEvent = new InputEvent("input", {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    inputType: "insertText",
                    data: view.state.doc.textContent,
                    isComposing: false,
                    dataTransfer: null,
                    view: window,
                    detail: 0,
                  });

                  Object.defineProperty(inputEvent, "target", {
                    writable: false,
                    value: this,
                  });

                  this.dispatchEvent(inputEvent);

                  if (!view.hasFocus()) {
                    const changeEvent = new Event("change", {
                      bubbles: true,
                      cancelable: false,
                      composed: true,
                    });

                    Object.defineProperty(changeEvent, "target", {
                      writable: false,
                      value: this,
                    });

                    this.dispatchEvent(changeEvent);
                  }
                }
              },
            }),
          }),
          new Plugin({
            props: {
              handleDOMEvents: {
                blur: (view) => {
                  const changeEvent = new Event("change", {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                  });

                  Object.defineProperty(changeEvent, "target", {
                    writable: false,
                    value: this,
                  });

                  this.dispatchEvent(changeEvent);
                  return false;
                },
              },
            },
          }),
        ],
      }),
      editable: () => !this.readOnly,
    });
  }

  _setupStyles() {
    const style = document.createElement("style");
    style.textContent = `
        .styled-textarea-paragraph {
          margin: 0;
          padding: 2px 0;
        }
        
        .ProseMirror {
          min-height: 100px;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-family: Arial, sans-serif;
          font-size: 14px;
          white-space: pre-wrap;
        }
        
        .styled-textarea-link {
          color: #0645ad;
          text-decoration: underline;
        }
        
        .styled-textarea-link:hover {
          text-decoration: none;
        }
        
        .ProseMirror[data-placeholder]::before {
          content: attr(data-placeholder);
          color: #999;
          position: absolute;
          pointer-events: none;
        }
      `;
    this.shadowRoot?.appendChild(style);
  }

  get readOnly() {
    return this.hasAttribute("readonly");
  }

  set readOnly(value) {
    value
      ? this.setAttribute("readonly", "")
      : this.removeAttribute("readonly");
    this._updateEditable();
  }

  _updateEditable() {
    this.editor?.setProps({ editable: () => !this.readOnly });
    this.editor?.dispatch(this.editor.state.tr);
  }

  attributeChangedCallback(name: string) {
    if (name === "readonly") this._updateEditable();
  }

  get value() {
    return this.editor?.state.doc.textContent || "";
  }

  set value(text) {
    if (!this.editor) return;
    const tr = this.editor.state.tr.replaceWith(
      0,
      this.editor.state.doc.content.size,
      this._schema.node("doc", null, [
        this._schema.node("paragraph", null, this._schema.text(text)),
      ]).content
    );
    this.editor.dispatch(tr);
  }

  addLink(start: number, end: number, href: string) {
    const tr = this.editor!.state.tr;
    tr?.addMark(start, end, this._schema.marks.link.create({ href }));
    this.editor?.dispatch(tr);
  }

  getStyles() {
    return this.editor?.state.doc.toJSON() || { content: [] };
  }

  select() {
    const tr = this.editor!.state.tr.setSelection(
      TextSelection.create(this.editor!.state.doc, 0, this.value.length)
    );
    this.editor!.dispatch(tr);
  }

  setSelectionRange(start: number, end: number) {
    const tr = this.editor!.state.tr.setSelection(
      TextSelection.create(this.editor!.state.doc, start, end)
    );
    this.editor!.dispatch(tr);
  }

  _handleUpdate(view: EditorView) {
    this.dispatchEvent(new Event("input", { bubbles: true }));
  }

  focus() {
    this.editor!.focus();
  }
  blur() {
    this.editor!.dom.blur();
  }
}

export default StyledTextarea;
