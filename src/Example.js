// @ts-check

export default class Example {
  constructor(element) {
    this.element = element;
  }

  init() {
    this.element.textContent = 'Hello, world!';
    console.log('ehu!');
  }
}
