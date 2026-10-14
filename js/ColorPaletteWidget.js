import { UIComponent } from './UIComponent.js';

/**
 * Цветовая палитра — Colormind API (без ключа).
 * http://colormind.io/api/
 */
export class ColorPaletteWidget extends UIComponent {
  static defaultTitle = 'Цветовая палитра';

  constructor(config) {
    super(config);
    this.palette = [];
  }

  afterRender() {
    this.refresh();
  }

  async fetchPalette() {
    const controller = this.createAbortController();
    const response = await fetch('http://colormind.io/api/', {
      method: 'POST',
      body: JSON.stringify({ model: 'default' }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Colormind ${response.status}`);
    const data = await response.json();
    return data.result || [];
  }

  rgbToHex(rgb) {
    return (
      '#' +
      rgb
        .map((c) => {
          const hex = Math.max(0, Math.min(255, c)).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  }

  async refresh() {
    const content = this.getContentElement();
    if (!content) return;

    this.setLoading(true);
    try {
      this.palette = await this.fetchPalette();
      content.innerHTML = this.renderPalette(this.palette);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      content.innerHTML = `
        <div class="error">
          <p>Не удалось загрузить палитру</p>
          <small>${this.escapeHtml(err.message)}</small>
        </div>
      `;
    } finally {
      this.setLoading(false);
    }
  }

  renderPalette(colors) {
    if (!colors.length) return '<p class="empty">Палитра пуста</p>';

    return `
      <div class="palette">
        ${colors
          .map((rgb) => {
            const hex = this.rgbToHex(rgb);
            return `
              <div class="palette__swatch" style="background-color: ${hex}" title="${hex}">
                <span class="palette__hex">${hex}</span>
              </div>
            `;
          })
          .join('')}
      </div>
      <p class="hint">Нажми ↻ для новой палитры</p>
    `;
  }
}
