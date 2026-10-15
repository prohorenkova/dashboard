import { UIComponent } from './UIComponent.js';

const GIPHY_API_KEY = 'SVHWpsy1WedH816XVFeFJQst2E4EnxBL';

export class GiphyWidget extends UIComponent {
  static defaultTitle = 'GIF';

  constructor(config) {
    super(config);
    this.tag = config.tag || 'inspiration';
    this.gifs = [];
  }

  afterRender() {
    // Привязываем обработчик формы поиска
    const form = this.getContentElement()?.querySelector('.giphy-search');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input');
        const value = input.value.trim();
        if (value) {
          this.tag = value;
          this.refresh();
        }
      });
    }
    this.refresh();
  }

async fetchGifs(limit = 6) {
  const controller = this.createAbortController();
  const r = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(this.tag)}&limit=${limit}&rating=g`,
    { signal: controller.signal }
  );
  if (!r.ok) throw new Error(`Giphy ${r.status}`);
  const json = await r.json();
  return (json.data || []).map((g) => ({
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
      // После перерисовки снова навешиваем обработчик формы
      const form = content.querySelector('.giphy-search');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = form.querySelector('input');
          const value = input.value.trim();
          if (value) {
            this.tag = value;
            this.refresh();
          }
        });
      }
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
    const searchForm = `
      <form class="giphy-search">
        <input type="text" placeholder="Поиск GIF..." value="${this.escapeHtml(this.tag)}">
        <button type="submit">Найти</button>
      </form>
    `;

    if (!gifs.length) {
      return `${searchForm}<p class="empty">Нет GIF</p>`;
    }

    return `
      ${searchForm}
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
