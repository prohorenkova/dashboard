import { UIComponent } from './UIComponent.js';

/**
 * Калькулятор рабочих дней.
 */
export class WorkingDaysWidget extends UIComponent {
  static defaultTitle = 'Рабочие дни';

  constructor(config) {
    super(config);
    this.countryCode = config.countryCode || 'RU';
    this.holidaySet = new Set();
  }

  afterRender() {
    this._drawForm();
    this._loadHolidays().then(() => this._calculate());
  }

  async _loadHolidays() {
    const year = new Date().getFullYear();
    try {
      const controller = this.createAbortController();
      const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${this.countryCode}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      this.holidaySet = new Set((data || []).map((h) => h.date));
      // также следующий год на всякий случай
      const res2 = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${year + 1}/${this.countryCode}`,
        { signal: controller.signal }
      );
      if (res2.ok) {
        const data2 = await res2.json();
        (data2 || []).forEach((h) => this.holidaySet.add(h.date));
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.warn('Holidays load failed', err);
    }
  }

  _drawForm() {
    const content = this.getContentElement();
    if (!content) return;

    const today = new Date().toISOString().slice(0, 10);
    const inTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

    content.innerHTML = `
      <div class="wd-form">
        <label class="wd-label">
          <span>От</span>
          <input type="date" class="wd-input" id="wd-from-${this.id}" value="${today}">
        </label>
        <label class="wd-label">
          <span>До</span>
          <input type="date" class="wd-input" id="wd-to-${this.id}" value="${inTwoWeeks}">
        </label>
        <button type="button" class="btn btn--small wd-calc">Посчитать</button>
      </div>
      <div class="wd-result" id="wd-result-${this.id}">—</div>
      <p class="hint">вот столько еще осталось...</p>
    `;

    const btn = content.querySelector('.wd-calc');
    this._addListener(btn, 'click', () => this._calculate());
    this._addListener(content.querySelector(`#wd-from-${this.id}`), 'change', () => this._calculate());
    this._addListener(content.querySelector(`#wd-to-${this.id}`), 'change', () => this._calculate());
  }

  _isBusinessDay(date) {
    const day = date.getDay();
    if (day === 0 || day === 6) return false;
    const iso = date.toISOString().slice(0, 10);
    if (this.holidaySet.has(iso)) return false;
    return true;
  }

  _calculate() {
    const fromEl = this.element?.querySelector(`#wd-from-${this.id}`);
    const toEl = this.element?.querySelector(`#wd-to-${this.id}`);
    const resultEl = this.element?.querySelector(`#wd-result-${this.id}`);
    if (!fromEl || !toEl || !resultEl) return;

    const from = new Date(fromEl.value + 'T00:00:00');
    const to = new Date(toEl.value + 'T00:00:00');
    if (isNaN(from) || isNaN(to) || to < from) {
      resultEl.textContent = 'Проверь даты';
      return;
    }

    let count = 0;
    const cur = new Date(from);
    while (cur <= to) {
      if (this._isBusinessDay(cur)) count++;
      cur.setDate(cur.getDate() + 1);
    }

    resultEl.innerHTML = `<strong>${count}</strong> раб. дн.`;
  }

  async refresh() {
    await this._loadHolidays();
    this._calculate();
  }
}
