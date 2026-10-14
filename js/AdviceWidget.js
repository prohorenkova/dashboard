import { UIComponent } from './UIComponent.js';

/**
 * Совет дня — Advice Slip API.
 * https://api.adviceslip.com/advice
 */
export class AdviceWidget extends UIComponent {
  static defaultTitle = 'Совет дня';

  constructor(config) {
    super(config);
  }

  afterRender() {
    this.refresh();
  }

  async fetchAdvice() {
    const controller = this.createAbortController();
    const url = `https://api.adviceslip.com/advice?t=${Date.now()}`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`AdviceSlip ${response.status}`);
    const data = await response.json();
    return data?.slip?.advice || null;
  }

  async refresh() {
    const content = this.getContentElement();
    if (!content) return;

    this.setLoading(true);
    try {
      const advice = await this.fetchAdvice();
      if (!advice) throw new Error('Пустой ответ');

      content.innerHTML = `
        <blockquote class="quote">
          <p class="quote__text">“${this.escapeHtml(advice)}”</p>
          <footer class="quote__author">... совет дня</footer>
        </blockquote>
      `;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      content.innerHTML = `
        <div class="error">
          <p>Не удалось загрузить совет</p>
          <small>${this.escapeHtml(err.message)}</small>
        </div>
      `;
    } finally {
      this.setLoading(false);
    }
  }
}
