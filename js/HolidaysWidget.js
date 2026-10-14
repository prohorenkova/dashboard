import { UIComponent } from './UIComponent.js';

/**
 * Праздники — Nager.Date API (без ключа).
 * https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}
 */
export class HolidaysWidget extends UIComponent {
  static defaultTitle = 'Праздники';

  constructor(config) {
    super(config);
    this.countryCode = config.countryCode || 'RU';
    this.year = config.year || new Date().getFullYear();
    this.holidays = [];
  }

  afterRender() {
    this.refresh();
  }

  async fetchHolidays() {
    const controller = this.createAbortController();
    const url = `https://date.nager.at/api/v3/PublicHolidays/${this.year}/${this.countryCode}`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Nager.Date ${response.status}`);
    return await response.json();
  }

  async refresh() {
    const content = this.getContentElement();
    if (!content) return;

    this.setLoading(true);
    try {
      this.holidays = await this.fetchHolidays();
      content.innerHTML = this.renderList(this.holidays);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      content.innerHTML = `
        <div class="error">
          <p>Не удалось загрузить праздники</p>
          <small>${this.escapeHtml(err.message)}</small>
        </div>
      `;
    } finally {
      this.setLoading(false);
    }
  }

  renderList(holidays) {
    if (!holidays?.length) {
      return `<p class="empty">Нет данных за ${this.year}</p>`;
    }

    const today = new Date().toISOString().slice(0, 10);
    const upcoming = holidays.filter((h) => h.date >= today).slice(0, 8);
    const list = upcoming.length ? upcoming : holidays.slice(-6);

    return `
      <div class="holidays-meta">
        <span>${this.countryCode}</span>
        <span>${this.year}</span>
      </div>
      <ul class="holidays-list">
        ${list
          .map((h) => {
            const isToday = h.date === today;
            const dateStr = new Date(h.date + 'T00:00:00').toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'short'
            });
            return `
              <li class="holidays-item ${isToday ? 'holidays-item--today' : ''}">
                <span class="holidays-date">${dateStr}</span>
                <span class="holidays-name">${this.escapeHtml(h.localName || h.name)}</span>
              </li>
            `;
          })
          .join('')}
      </ul>
      <p class="hint">Nager.Date · ${this.countryCode}</p>
    `;
  }
}
