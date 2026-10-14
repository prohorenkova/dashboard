import { UIComponent } from './UIComponent.js';

/**
 * Дата и время (локальный виджет).
 */
export class DateTimeWidget extends UIComponent {
  static defaultTitle = 'Дата и время';

  constructor(config) {
    super(config);
    this.timerId = null;
  }

  afterRender() {
    this.element?.classList.add('widget--compact');
    this._drawContent();
    this.startClock();
  }

  formatTime() {
    return new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatDate() {
    return new Date().toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  _drawContent() {
    const content = this.getContentElement();
    if (!content) return;

    content.innerHTML = `
      <div class="datetime">
        <div class="datetime__time" id="dt-time-${this.id}">${this.formatTime()}</div>
        <div class="datetime__date">${this.formatDate()}</div>
      </div>
    `;
  }

  startClock() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      const el = this.element?.querySelector(`#dt-time-${this.id}`);
      if (el) el.textContent = this.formatTime();
    }, 1000);
  }

  async refresh() {
    this._drawContent();
  }

  destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    super.destroy();
  }
}
