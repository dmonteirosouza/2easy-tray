const axios = require('axios');

class CaptchaService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.CAPTCHA_API_KEY;
    this.baseUrl = process.env.CAPTCHA_SERVICE_URL || 'https://api.captchaservice.com'; // Substitua pela URL do serviço real
  }

  /**
   * Resolve um captcha reCAPTCHA v2
   * @param {Object} options - Opções para resolver o captcha
   * @param {string} options.url_page_captcha - URL da página que contém o captcha
   * @param {string} options.data_site_key - Site key do reCAPTCHA
   * @param {string} options.version - Versão do reCAPTCHA (v2, v3, etc)
   * @returns {Promise<string>} - Token g-recaptcha-response
   */
  async solveCaptcha(options) {
    try {
      // Envia requisição para o serviço de resolução de captcha
      const response = await axios.post(`${this.baseUrl}/captcha/recaptcha`, {
        apiKey: this.apiKey,
        url_page_captcha: options.url_page_captcha,
        data_site_key: options.data_site_key,
        version: options.version
      }, {
        validateStatus: function(status) {
          // Verifica especificamente o código 201 como único válido
          return status === 201;
        }
      });

      // Verifica explicitamente se o status é 201
      if (response.status !== 201) {
        throw new Error(`Código de status inválido: ${response.status}. Esperado: 201`);
      }

      return response.data.solution.gRecaptchaResponse;
    } catch (error) {
      console.error('Erro ao resolver captcha:', error.message);
      throw error;
    }
  }
}

module.exports = CaptchaService;