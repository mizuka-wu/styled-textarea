# webcomponent-styled-textarea

一个基于 Web Components 的自定义文本编辑器组件，支持对文本应用自定义样式标记。底层使用 ProseMirror 实现，提供了与原生 textarea 相似的使用体验。

## 特性

- 🎨 支持自定义文本样式标记
- 📝 与原生 textarea 行为一致
- 🔄 实时同步文本内容
- 🎯 精确的选区管理
- 🧩 基于 Web Components，易于集成

## 安装

```bash
npm install webcomponent-styled-textarea
# 或
pnpm add webcomponent-styled-textarea
# 或
yarn add webcomponent-styled-textarea
```

## 使用方法

### 注册组件

```typescript
import StyledTextarea from 'webcomponent-styled-textarea';

// 注册自定义元素
customElements.define('styled-textarea', StyledTextarea);
```

### 基本使用

```html
<styled-textarea></styled-textarea>

<script>
  const textarea = document.querySelector('styled-textarea');
  
  // 设置文本内容
  textarea.value = '这是一段文本';
  
  // 监听输入事件
  textarea.addEventListener('input', (e) => {
    console.log('文本内容：', e.target.value);
  });
</script>
```

### 添加样式标记

```typescript
const textarea = document.querySelector('styled-textarea');

// 获取当前选区
const { from, to } = textarea.selection;

// 添加红色加粗样式
textarea.addMarks(from, [{
  type: 'customStyle',
  attrs: {
    css: 'color: red; font-weight: bold;',
    className: 'highlight'
  }
}], to - from);

// 添加背景色
textarea.addMarks(from, [{
  type: 'customStyle',
  attrs: {
    css: 'background: #f0f8ff;',
    className: 'bg-highlight'
  }
}], to - from);
```

### 移除样式标记

```typescript
// 移除指定范围内的所有样式
textarea.removeMarks(0);

// 移除指定范围内的特定样式
textarea.removeMarks(0, undefined, ['customStyle']);
```

## API

### 属性

- `value: string` - 获取或设置文本内容
- `readonly: boolean` - 获取或设置只读状态
- `selection: { from: number, to: number }` - 获取当前选区范围

### 方法

- `addMarks(from: number, marks: Mark[], length: number)` - 添加样式标记
  - `from`: 起始位置
  - `marks`: 样式标记数组
  - `length`: 应用长度

- `removeMarks(from: number, length?: number, types?: string[])` - 移除样式标记
  - `from`: 起始位置
  - `length`: 移除长度（可选）
  - `types`: 要移除的标记类型（可选）

- `getMarks(pos: number): Mark[]` - 获取指定位置的所有标记

### 事件

- `input` - 文本内容变化时触发
- `change` - 文本内容或样式变化时触发
- `select` - 选区变化时触发

## 浏览器支持

支持所有现代浏览器：

- Chrome
- Firefox
- Safari
- Edge

## 许可证

MIT
