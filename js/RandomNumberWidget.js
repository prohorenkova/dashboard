import { UIComponent } from './UIComponent.js';

/**
 * Генератор случайного числа (локальный).
 */
export class RandomNumberWidget extends UIComponent {
  static defaultTitle = 'Случайное число';

  constructor(config) {
    super(config);
    this.min = 1;
    this.max = 100;
    this.current = null;
  }

  afterRender() {
    this.element?.classList.add('widget--compact');
    this._drawContent();
    this.generate();
  }

  generate() {
    this.current = Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
    const el = this.element?.querySelector('.random-number__value');
    if (el) {
      el.classList.remove('random-number__value--pop');
      // force reflow
      void el.offsetWidth;
      el.textContent = this.current;
      el.classList.add('random-number__value--pop');
    }
  }

  _drawContent() {
    const content = this.getContentElement();
    if (!content) return;

    content.innerHTML = `
      <div class="random-number">
        <div class="random-number__value">${this.current ?? '—'}</div>
        <div class="random-number__range">${this.min} — ${this.max}</div>
        <button type="button" class="btn btn--small random-number__btn">Сгенерировать</button>
      </div>
    `;

    const btn = content.querySelector('.random-number__btn');
    this._addListener(btn, 'click', () => this.generate());
  }

  async refresh() {
    this.generate();
  }
}
