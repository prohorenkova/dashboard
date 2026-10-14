import { UIComponent } from './UIComponent.js';

/**
 * Случайный фильм Studio Ghibli.
 * Описание переводится на русский через MyMemory (без ключа).
 */
export class GhibliWidget extends UIComponent {
  static defaultTitle = 'Ghibli Film';

  constructor(config) {
    super(config);
    this.film = null;
  }

  afterRender() {
    this.refresh();
  }

  async fetchFilms() {
    const controller = this.createAbortController();
    const urls = [
      'https://ghibliapi.vercel.app/films',
      'https://ghibliapi.dev/api/films'
    ];

    let lastError;
    for (const url of urls) {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`${url} → ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length) return data;
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        lastError = err;
      }
    }
    throw lastError || new Error('Ghibli API unavailable');
  }

  async fetchFilmById(id) {
    const controller = this.createAbortController();
    const urls = [
      `https://ghibliapi.vercel.app/films/${id}`,
      `https://ghibliapi.dev/api/films/${id}`
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) continue;
        return await res.json();
      } catch (err) {
        if (err.name === 'AbortError') throw err;
      }
    }
    return null;
  }

  /**
   * Перевод EN → RU через MyMemory (бесплатно, без ключа).
   */
  async translateToRu(text) {
    if (!text) return '';
    try {
      const controller = this.createAbortController();
      const url =
        'https://api.mymemory.translated.net/get?q=' +
        encodeURIComponent(text.slice(0, 450)) +
        '&langpair=en|ru';
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('translate ' + res.status);
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      // если перевод не удался — вернём оригинал
      if (!translated || translated === text.slice(0, 450)) return text;
      return translated;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.warn('Translation failed, using English', err);
      return text;
    }
  }

  async refresh() {
    const content = this.getContentElement();
    if (!content) return;

    this.setLoading(true);
    try {
      const films = await this.fetchFilms();
      const random = films[Math.floor(Math.random() * films.length)];
      this.film = (await this.fetchFilmById(random.id)) || random;

      const originalDesc = this.film.description || '';
      const ruDesc = await this.translateToRu(originalDesc);
      this.film._descriptionRu = ruDesc;

      content.innerHTML = this.renderFilm(this.film);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      content.innerHTML = `
        <div class="error">
          <p>Не удалось загрузить фильм</p>
          <small>${this.escapeHtml(err.message)}</small>
        </div>
      `;
    } finally {
      this.setLoading(false);
    }
  }

  renderFilm(film) {
    if (!film) return '<p class="empty">Нет данных</p>';

    const title = film.title || film.name || '—';
    const original = film.original_title || '';
    const desc = film._descriptionRu || film.description || '';
    const short = desc.length > 280 ? desc.slice(0, 280) + '…' : desc;
    const year = film.release_date || '';
    const director = film.director || '';
    const score = film.rt_score ? `${film.rt_score}%` : '';

    return `
      <div class="ghibli">
        <h3 class="ghibli__title">${this.escapeHtml(title)}</h3>
        ${original ? `<div class="ghibli__original">${this.escapeHtml(original)}</div>` : ''}
        <div class="ghibli__meta">
          ${year ? `<span>${this.escapeHtml(year)}</span>` : ''}
          ${director ? `<span>${this.escapeHtml(director)}</span>` : ''}
          ${score ? `<span>RT ${this.escapeHtml(score)}</span>` : ''}
        </div>
        <p class="ghibli__desc">${this.escapeHtml(short)}</p>
      </div>
      <p class="hint">Studio Ghibli · перевод RU</p>
    `;
  }
}
