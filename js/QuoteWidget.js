import { UIComponent } from './UIComponent.js';

/**
 * Случайная вдохновляющая цитата.
 * API: https://api.quotable.io (без ключа)
 */
export class QuoteWidget extends UIComponent {
  static defaultTitle = 'Цитата момента';

  constructor(config) {
    super(config);
    this.quote = null;
  }

  afterRender() {
    this.refresh();
  }

  async fetchQuote() {
    const controller = this.createAbortController();
    const url = 'https://api.quotable.io/random?tags=inspirational|wisdom|success|motivational';
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Quotable ${response.status}`);
    return await response.json();
  }

  async refresh() {
    const content = this.getContentElement();
    if (!content) return;

    this.setLoading(true);
    try {
      this.quote = await this.fetchQuote();
      content.innerHTML = `
        <blockquote class="quote">
          <p class="quote__text">“${this.escapeHtml(this.quote.content)}”</p>
          <footer class="quote__author">— ${this.escapeHtml(this.quote.author)}</footer>
        </blockquote>
      `;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      content.innerHTML = `
        <div class="error">
          <p>Не удалось загрузить цитату</p>
          <small>${this.escapeHtml(err.message)}</small>
        </div>
      `;
    } finally {
      this.setLoading(false);
    }
  }
}
