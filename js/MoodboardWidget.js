import { UIComponent } from './UIComponent.js';

/**
 * Inspiration Board — настоящий embed доски Pinterest.
 * Использует официальный виджет Pinterest (без API-ключа).
 * Можно менять URL доски через config.boardUrl.
 */
export class MoodboardWidget extends UIComponent {
  static defaultTitle = 'Pinterest Board';

  constructor(config) {
    super(config);
    // Публичная доска по умолчанию (замени на свою при желании)
    this.boardUrl = config.boardUrl || 'https://www.pinterest.com/pinterest/official-news/';
  }

  afterRender() {
    this._drawContent();
  }

  _drawContent() {
    const content = this.getContentElement();
    if (!content) return;

    content.innerHTML = `
      <div class="pinterest-embed" id="pin-embed-${this.id}">
        <a data-pin-do="embedBoard"
           data-pin-board-width="100%"
           data-pin-scale-height="340"
           data-pin-scale-width="80"
           href="${this.escapeHtml(this.boardUrl)}"></a>
      </div>
      <p class="hint">Официальный embed Pinterest</p>
    `;

    this._loadPinterestScript();
  }

  _loadPinterestScript() {
    if (window.PinUtils || document.getElementById('pinterest-pinit')) {
      if (window.PinUtils) {
        try { window.PinUtils.build(); } catch (_) {}
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'pinterest-pinit';
    script.async = true;
    script.defer = true;
    script.src = 'https://assets.pinterest.com/js/pinit.js';
    script.onload = () => {
      if (window.PinUtils) {
        try { window.PinUtils.build(); } catch (_) {}
      }
    };
    document.body.appendChild(script);
  }

  async refresh() {
    this._drawContent();
  }
}
