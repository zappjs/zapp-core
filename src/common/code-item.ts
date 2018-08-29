interface CodeItemProps {
  mode?: string;
  value?: string;
}

export default class CodeItem {
  mode = 'test';
  value = '';

  constructor(props: CodeItemProps = {}) {
    if (props.mode) {
      this.mode = props.mode;
    }
    if (props.value) {
      this.value = props.value;
    }
  }
  getMode() {
    return this.mode;
  }
  setMode(mode) {
    this.mode = mode;
  }
  getValue() {
    return this.value;
  }
  setValue(value) {
    this.value = value;
  }
  getType() {
    return 'code';
  }
}
