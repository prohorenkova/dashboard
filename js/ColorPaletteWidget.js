import { UIComponent } from './UIComponent.js';

/**
 * Цветовая палитра.
 * Colormind (http) на HTTPS-хостинге блокируется → пробуем CORS-прокси,
 * при ошибке — локальная генерация палитры.
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

  async fetchFromColormind() {
    const controller = this.createAbortController();
    const body = JSON.stringify({ model: 'default' });

    // 1) Прямой запрос (работает на localhost / http)
    try {
      const res = await fetch('http://colormind.io/api/', {
        method: 'POST',
        body,
        signal: controller.signal
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.result?.length) return data.result;
      }
    } catch (_) {
      /* mixed content / CORS — идём дальше */
    }

    // 2) HTTPS CORS-прокси
    const proxies = [
      'https://corsproxy.io/?' + encodeURIComponent('http://colormind.io/api/'),
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('http://colormind.io/api/')
    ];

    for (const url of proxies) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          body,
          signal: controller.signal
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data?.result?.length) return data.result;
      } catch (_) {
        /* следующий прокси */
      }
    }

    throw new Error('Colormind недоступен');
  }

  /** Локальная палитра, если API недоступен (GitHub Pages и т.п.) */
  generateLocalPalette() {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const colors = [];
    const baseH = rand(0, 360);
    for (let i = 0; i < 5; i++) {
      const h = (baseH + i * 28 + rand(-10, 10) + 360) % 360;
      const s = rand(35, 75);
      const l = rand(35, 75);
      colors.push(this.hslToRgb(h, s, l));
    }
    return colors;
  }

  hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
      Math.round(255 * f(0)),
      Math.round(255 * f(8)),
      Math.round(255 * f(4))
    ];
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
    let source = 'colormind';
    try {
      this.palette = await this.fetchFromColormind();
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn(err);
      this.palette = this.generateLocalPalette();
      source = 'local';
    }

    content.innerHTML = this.renderPalette(this.palette, source);
    this.setLoading(false);
  }

  renderPalette(colors, source = 'colormind') {
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
      <p class="hint">${source === 'local' ? 'Локальная палитра' : 'Colormind'} · нажми ↻</p>
    `;
  }
}
