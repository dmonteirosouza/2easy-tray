# Aplicação de Ponto 2easy

Uma aplicação Electron para automatizar o registro de ponto no sistema 2easy.

## Novas Funcionalidades

- Suporte para resolução automática de captcha reCAPTCHA v2/v3
- Interface aprimorada para configuração
- Melhor tratamento de erros e notificações

## Pré-requisitos

- Node.js 14+
- NPM ou Yarn
- Conta em um serviço de resolução de captcha

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Copie o arquivo `.env.example` para `.env` e configure suas credenciais:
   ```
   cp .env.example .env
   ```
4. Edite o arquivo `.env` e insira sua chave API do serviço de captcha:
   ```
   CAPTCHA_API_KEY=sua_chave_api_aqui
   CAPTCHA_SERVICE_URL=url_do_servico_de_captcha
   ```

## Como usar

1. Inicie a aplicação:
   ```
   npm start
   ```

2. Configure suas credenciais do 2easy e as configurações do captcha:
   - Clique com o botão direito no ícone do 2easy na bandeja do sistema
   - Selecione "Configurações"
   - Preencha seus dados de CPF e senha
   - Configure as informações do captcha:
     - URL da página do captcha (normalmente `https://www.2easy.com.br`)
     - Chave do site (data-site-key) obtida da página de login
     - Versão do reCAPTCHA (geralmente v2)
   - Clique em "Salvar Configurações"

3. Para registrar o ponto:
   - Clique com o botão direito no ícone do 2easy na bandeja do sistema
   - Selecione "Bater o ponto"
   - Aguarde a resolução do captcha e o registro do ponto
   - Você receberá uma notificação quando o ponto for registrado

## Como obter a chave do site (data-site-key)

1. Acesse a página de login do 2easy
2. Clique com o botão direito no elemento do captcha e selecione "Inspecionar"
3. Procure pelo atributo "data-sitekey" no elemento HTML do captcha
4. Copie o valor deste atributo e cole no campo correspondente nas configurações

## Serviços de Resolução de Captcha Recomendados

- [2Captcha](https://2captcha.com/)
- [Anti-Captcha](https://anti-captcha.com/)
- [CapMonster](https://capmonster.cloud/)

Escolha um destes serviços, crie uma conta, obtenha sua chave API e configure-a no arquivo `.env`.

## Empacotar a aplicação

Para criar um executável standalone:

```
npm run dist
```

Os executáveis serão gerados na pasta `dist`.

## Licença

Este projeto é licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.