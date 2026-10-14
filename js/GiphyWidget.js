import { UIComponent } from './UIComponent.js';

/***/
const GIPHY_API_KEY = 'SVHWpsy1WedH816XVFeFJQst2E4EnxBL'; 

export class GiphyWidget extends UIComponent {
  static defaultTitle = 'GIF';

  constructor(config) {
    super(config);
    this.tag = config.tag || 'inspiration';
    this.gifs = [];
  }

  afterRender() {
    this.refresh();
  }

  async fetchGifs(limit = 6) {
    if (!GIPHY_API_KEY || GIPHY_API_KEY === 'YOUR_GIPHY_API_KEY') {
      throw new Error('Вставь Giphy API Key в GiphyWidget.js');
    }

    const controller = this.createAbortController();
    // Берём несколько случайных по тегу
    const promises = Array.from({ length: limit }, () =>
      fetch(
        `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${encodeURIComponent(this.tag)}&rating=g`,
        { signal: controller.signal }
      ).then((r) => {
        if (!r.ok) throw new Error(`Giphy ${r.status}`);
        return r.json();
      })
    );

    const results = await Promise.all(promises);
    return results
      .map((r) => r?.data)
      .filter(Boolean)
      .map((g) => ({
        id: g.id,
        title: g.title || 'GIF',
        url: g.images?.fixed_height?.url || g.images?.original?.url,
        link: g.url
      }));
  }

  async refresh() {
    const content = this.getContentElement();
    if (!content) return;

    this.setLoading(true);
    try {
      this.gifs = await this.fetchGifs(6);
      content.innerHTML = this.renderGrid(this.gifs);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      content.innerHTML = `
        <div class="error">
          <p>Не удалось загрузить GIF</p>
          <small>${this.escapeHtml(err.message)}</small>
          <p class="hint">надо ключ</p>
        </div>
      `;
    } finally {
      this.setLoading(false);
    }
  }

  renderGrid(gifs) {
    if (!gifs.length) return '<p class="empty">Нет GIF</p>';

    return `
      <div class="giphy-grid">
        ${gifs
          .map(
            (g) => `
          <a class="giphy-card" href="${this.escapeHtml(g.link || '#')}" target="_blank" rel="noopener noreferrer" title="${this.escapeHtml(g.title)}">
            <img src="${this.escapeHtml(g.url)}" alt="${this.escapeHtml(g.title)}" loading="lazy">
          </a>
        `
          )
          .join('')}
      </div>
      <p class="hint">Giphy · #${this.escapeHtml(this.tag)}</p>
    `;
  }
}
