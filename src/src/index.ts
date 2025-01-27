import { Schema } from 'prosemirror-model';
import { EditorState, AllSelection, TextSelection, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { baseKeymap, chainCommands, deleteSelection, joinBackward, selectNodeBackward } from 'prosemirror-commands';

export class StyledTextarea extends HTMLElement {
  private _schema: Schema;
  private editor: EditorView | null = null;

  static get observedAttributes() {
    return ['value', 'readonly'];
  }

  constructor() {
    super();
    this._schema = this._createSchema();
    this.attachShadow({ mode: 'open' });
    this._initEditor();
    this._setupStyles();
  }

  _createSchema() {
    return new Schema({
      nodes: {
        doc: { content: 'paragraph+' },
        paragraph: {
          content: 'text*',
          toDOM: () => ['p', { class: 'styled-textarea-paragraph' }, 0],
          parseDOM: [{ tag: 'p' }],
        },
        text: { inline: true },
      },
      marks: {
        customStyle: {
          attrs: {
            css: { default: '' },
            className: { default: '' },
          },
          toDOM: node => [
            'span',
            {
              style: node.attrs.css,
              class: node.attrs.className,
            },
            0,
          ],
          parseDOM: [
            {
              tag: 'span',
              getAttrs: dom => ({
                css: dom.getAttribute('style') || '',
                className: dom.getAttribute('class') || '',
              }),
            },
          ],
        },
        link: {
          attrs: {
            href: { default: '' },
            editMode: { default: false },
          },
          toDOM: node => {
            const isEditable = this.editor!.props.editable!(this.editor!.state) ?? true;
            return [
              isEditable ? 'span' : 'a',
              {
                class: 'styled-textarea-link',
                href: node.attrs.href,
                target: isEditable ? null : '_blank',
                style: isEditable ? 'cursor: text; pointer-events: none;' : 'cursor: pointer;',
              },
              0,
            ];
          },
          parseDOM: [
            {
              tag: 'a.styled-textarea-link, span.styled-textarea-link',
              getAttrs: dom => ({
                href: dom.getAttribute('href') || '',
                editMode: dom.tagName.toLowerCase() === 'span',
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
        doc: this._schema.node('doc', null, [
          this._schema.node('paragraph', null, this.value ? this._schema.text(this.value) : []),
        ]),
        plugins: [
          new Plugin({
            props: {
              handleKeyDown: (view, event) => {
                const keyEvent = new KeyboardEvent('keydown', {
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

                Object.defineProperty(keyEvent, 'target', {
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
                  if (event.key === 'Backspace') {
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
                  case 'Enter':
                    // 在当前位置插入新段落
                    // eslint-disable-next-line no-case-declarations
                    const tr = view.state.tr.split(pos);
                    view.dispatch(tr);
                    return true;

                  case 'ArrowUp':
                    if ($from.pos === 0) {
                      // 在文档开头时阻止向上移动
                      return true;
                    }
                    return false;

                  case 'ArrowDown':
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
                const keyEvent = new KeyboardEvent('keypress', {
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

                Object.defineProperty(keyEvent, 'target', {
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
                  const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    inputType: 'insertText',
                    data: view.state.doc.textContent,
                    isComposing: false,
                    dataTransfer: null,
                    view: window,
                    detail: 0,
                  });

                  Object.defineProperty(inputEvent, 'target', {
                    writable: false,
                    value: this,
                  });

                  this.dispatchEvent(inputEvent);

                  if (!view.hasFocus()) {
                    const changeEvent = new Event('change', {
                      bubbles: true,
                      cancelable: false,
                      composed: true,
                    });

                    Object.defineProperty(changeEvent, 'target', {
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
                blur: view => {
                  const changeEvent = new Event('change', {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                  });

                  Object.defineProperty(changeEvent, 'target', {
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
    const style = document.createElement('style');
    style.textContent = `
        :host {
          display: block;
          width: 100%;
        }

        .styled-textarea-paragraph {
          margin: 0;
          padding: 0;
        }
        
        .ProseMirror {
          white-space: pre-wrap;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          max-width: inherit;
          word-wrap: break-word;
          overflow-wrap: break-word;
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
    return this.hasAttribute('readonly');
  }

  set readOnly(value) {
    value ? this.setAttribute('readonly', '') : this.removeAttribute('readonly');
    this._updateEditable();
  }

  _updateEditable() {
    this.editor?.setProps({ editable: () => !this.readOnly });
    this.editor?.dispatch(this.editor.state.tr);
  }

  attributeChangedCallback(name: string) {
    if (name === 'readonly') this._updateEditable();
  }

  get value() {
    if (!this.editor) return '';
    const doc = this.editor.state.doc;
    let text = '';
    doc.forEach((node, offset) => {
      if (text) text += '\n'; // 在段落之间添加换行符
      text += node.textContent;
    });
    return text;
  }

  set value(text) {
    if (!this.editor) return;
    // 按换行符分割文本
    const paragraphs = text.split(/\r?\n/);
    const nodes = paragraphs.map(content =>
      this._schema.node('paragraph', null, content ? this._schema.text(content) : [])
    );

    const tr = this.editor.state.tr.replaceWith(0, this.editor.state.doc.content.size, nodes);
    this.editor.dispatch(tr);
  }

  addLink(start: number, end: number, href: string) {
    const tr = this.editor!.state.tr;
    tr?.addMark(start, end, this._schema.marks.link.create({ href }));
    this.editor?.dispatch(tr);
  }

  select() {
    const doc = this.editor!.state.doc;
    const tr = this.editor!.state.tr.setSelection(new AllSelection(doc));
    this.editor!.dispatch(tr);
  }

  selectRange(start: number = -1, end: number = -1) {
    if (start === -1) start = this.editor!.state.doc.content.size;
    if (end === -1) end = this.editor!.state.doc.content.size;
    const tr = this.editor!.state.tr.setSelection(TextSelection.create(this.editor!.state.doc, start, end));
    this.editor!.dispatch(tr);
  }

  _handleUpdate(view: EditorView) {
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }

  focus() {
    this.editor!.focus();
  }
  blur() {
    this.editor!.dom.blur();
  }

  /**
   * 获取当前选区
   * @returns 返回当前选区，包含 from 和 to 位置
   */
  get selection() {
    if (!this.editor) return { from: 0, to: 0 };
    const { from, to } = this.editor.state.selection;
    return { from, to };
  }

  /**
   * 添加文本标记
   * @param from 起始位置
   * @param marks 标记数组，每个标记包含 type 和 attrs
   * @param length 可选，标记长度。如果不指定，则标记到文档末尾
   */
  addMarks(
    from: number,
    marks: Array<{
      type: string;
      attrs?: Record<string, any>;
    }>,
    length?: number
  ) {
    if (!this.editor) return;

    const tr = this.editor.state.tr;
    const doc = this.editor.state.doc;
    const end = length !== undefined ? from + length : doc.content.size;

    // 添加新的标记
    marks.forEach(mark => {
      const markType = this._schema.marks[mark.type];
      if (markType) {
        tr.addMark(from, end, markType.create(mark.attrs || {}));
      }
    });

    this.editor.dispatch(tr);
  }

  /**
   * 移除指定范围内的标记
   * @param from 起始位置
   * @param length 可选，要移除标记的长度。如果不指定，则移除到文档末尾
   * @param types 可选，要移除的标记类型数组。如果不指定，则移除所有类型的标记
   */
  removeMarks(from: number, length?: number, types?: string[]) {
    if (!this.editor) return;

    const tr = this.editor.state.tr;
    const doc = this.editor.state.doc;
    const end = length !== undefined ? from + length : doc.content.size;

    if (types && types.length > 0) {
      // 移除指定类型的标记
      types.forEach(type => {
        const markType = this._schema.marks[type];
        if (markType) {
          tr.removeMark(from, end, markType);
        }
      });
    } else {
      // 移除所有标记
      tr.removeMark(from, end);
    }

    this.editor.dispatch(tr);
  }

  /**
   * 获取指定位置的所有标记
   * @param pos 位置
   * @returns 标记数组
   */
  getMarks(pos: number) {
    if (!this.editor) return [];

    const doc = this.editor.state.doc;
    const resolvedPos = doc.resolve(pos);
    const marks = resolvedPos.marks();

    return marks.map(mark => ({
      type: mark.type.name,
      attrs: mark.attrs,
    }));
  }
}

export default StyledTextarea;
