'use strict';

const AI = {
  _geminiKey: '',
  _openaiKey: '',

  async init() {
    try {
      const s = await SettingsDB.get();
      this._geminiKey = s.ai?.gemini_key || '';
      this._openaiKey = s.ai?.openai_key || '';
    } catch { /* keys remain empty */ }
  },

  async call(prompt) {
    if (this._geminiKey) {
      try { return await this._callGemini(prompt); }
      catch (e) { console.warn('Gemini failed, fallback to OpenAI', e); }
    }
    if (this._openaiKey) {
      return await this._callOpenAI(prompt);
    }
    throw new Error('AI_UNAVAILABLE');
  },

  async _callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this._geminiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  async _callOpenAI(prompt) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this._openaiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] })
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  },

  async reformulate(text, style = 'professional') {
    const prompt = `أنت كاتب متخصص في اللغة العربية الفصحى.
أعد صياغة النص التالي بأسلوب ${style === 'professional' ? 'رسمي مهني' : 'سلس وجذاب'}.
حافظ على المعنى الأصلي وحسّن الأسلوب. أعطني النص المعاد صياغته فقط، بدون شرح.

النص: ${text}`;
    return await this.call(prompt);
  },

  async generateHooks(topic, count = 5) {
    const prompt = `أنت خبير في كتابة العناوين الجذابة.
اقترح ${count} عناوين جذابة لمحتوى عن: ${topic}
العناوين يجب أن تكون بالعربية الفصحى، مثيرة للاهتمام، ومناسبة لجمعية ثقافية تعليمية.
أعطني القائمة فقط، كل عنوان في سطر، بدون ترقيم أو شرح.`;
    const result = await this.call(prompt);
    return result.split('\n').map(l => l.trim()).filter(Boolean);
  },

  async translateToFrench(textAr) {
    const prompt = `Traduis ce texte arabe en français de manière naturelle et fluide.
Le contexte est une association culturelle éducative au Tchad.
Donne uniquement la traduction, sans explication.

Texte arabe: ${textAr}`;
    return await this.call(prompt);
  },

  async translateToArabic(textFr) {
    const prompt = `ترجم هذا النص من الفرنسية إلى العربية الفصحى بطريقة سلسة وطبيعية.
السياق هو جمعية ثقافية تعليمية في تشاد.
أعطني الترجمة فقط، بدون شرح.

النص الفرنسي: ${textFr}`;
    return await this.call(prompt);
  },

  async improveArabic(text) {
    const prompt = `أنت محرر لغوي متخصص في اللغة العربية الفصحى.
صحّح الأخطاء اللغوية وحسّن الأسلوب في النص التالي مع الحفاظ على المعنى.
أعطني النص المحسّن فقط، بدون شرح.

النص: ${text}`;
    return await this.call(prompt);
  }
};
