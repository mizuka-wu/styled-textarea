import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
// import { baseKeymap } from "prosemirror-commands";

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
            this._schema.text(this.value || "")
          ),
        ]),
        // plugins: [
        //   commands.keymap(baseKeymap),
        //   new Plugin({
        //     view: () => ({
        //       update: (view: EditorView) => this._handleUpdate(view),
        //     }),
        //   }),
        // ],
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
          line-height: 1.5;
        }
        
        .ProseMirror {
          min-height: 100px;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-family: Arial, sans-serif;
          font-size: 14px;
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
}

export default StyledTextarea;
