const { resolve } = require('path');
const { app, Menu, Tray, Notification, nativeImage, BrowserWindow, ipcMain } = require('electron');
const axios = require('axios');
const qs = require('qs');
require('dotenv').config();
const Store = require('./libs/store');
const CaptchaService = require('./libs/captcha-service');

app.setAppUserModelId('2easy');

const store = new Store({
  configName: 'user-data',
  defaults: {
    login: {
      cpf: '',
      senha: ''
    },
    captcha: {
      url_page_captcha: 'https://www.2easy.com.br',
      data_site_key: '',
      version: 'v2'
    }
  }
});

let mainWindow;
let captchaService;

ipcMain.on('submit:config', (event, data) => {
  store.set('login', data.login);
  store.set('captcha', data.captcha);
  mainWindow.hide();

  mainWindow.webContents.send('submit:config:success', data);
});

app.whenReady().then(() => {
  // Inicializa o serviço de captcha
  captchaService = new CaptchaService();

  const tray = new Tray(resolve("assets", "icon.png"));

  const horaIcon = nativeImage.createFromPath(
    resolve("assets", "hora.png")
  );

  const definicoesIcon = nativeImage.createFromPath(
    resolve("assets", "definicoes.png")
  );

  const sairIcon = nativeImage.createFromPath(
    resolve("assets", "fechadas.png")
  );

  function estaLogado(cookie) {
    return axios.get('https://www.2easy.com.br/ORIGO/asp/Content/Main.asp', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
        'Cookie': cookie
      }
    }).then(response => {
      return response.data.includes('<span class="easy-sp-username d-none d-xl-block">');
    });
  }

  function baterPonto(cookie) {
    return axios.post('https://www.2easy.com.br/ORIGO/asp/TransData/TransData_Ponto_RegistrarPonto.asp',
      qs.stringify({
        'Impersonate': '1',
        'CodPessoa': ''
      }), {
      params: {
        'OPT': '3'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
        'Cookie': cookie
      }
    }).then(response => response);
  }

  async function realizarLogin() {
    const login = store.get('login');
    const captchaConfig = store.get('captcha');
    let gRecaptchaResponse = '';

    try {
      // Notifica o usuário que está resolvendo o captcha
      new Notification({
        title: 'Resolvendo captcha',
        subtitle: '2easy',
        body: 'Aguarde, estamos resolvendo o captcha...',
        icon: horaIcon,
      }).show();

      // Resolve o captcha
      gRecaptchaResponse = await captchaService.solveCaptcha({
        url_page_captcha: captchaConfig.url_page_captcha,
        data_site_key: captchaConfig.data_site_key,
        version: captchaConfig.version
      });

      // Faz o login com o token do captcha
      const response = await axios.post('https://www.2easy.com.br/ORIGO/asp/TransData/TransData_Login.asp', 
        qs.stringify({
          'txtLogin': login.cpf || '',
          'txtSenha': login.senha || '',
          'g-recaptcha-response': gRecaptchaResponse,
          'hddTokenError': null,
          'hddToken': null
        }), {
          params: {
            'OPT': '1'
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
            'Origin': 'https://www.2easy.com.br',
            'Connection': 'keep-alive',
          }
        });

      return response.headers['set-cookie'] ? response.headers['set-cookie'][0] : null;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      
      new Notification({
        title: 'Erro de login',
        subtitle: '2easy',
        body: 'Não foi possível fazer login. Verifique suas credenciais e configurações de captcha.',
        icon: horaIcon,
      }).show();
      
      return null;
    }
  }

  function configuracoes() {
    mainWindow = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      title: 'Ponto 2easy',
      width: 600,
      height: 600
    });

    mainWindow.on('minimize', function (event) {
      event.preventDefault();
      mainWindow.hide();
    });

    mainWindow.on('close', function (event) {
      if (!event.isQuiting) {
        event.preventDefault();
        mainWindow.hide();
      }

      return false;
    });

    mainWindow.setMenu(null);
    mainWindow.setResizable(false);

    mainWindow.loadURL('file://' + resolve(__dirname, "pages", "config.html"));

    setTimeout(() => {
      const login = store.get('login');
      const captcha = store.get('captcha');
      mainWindow.webContents.send('config:store', { login, captcha });
    }, 1500);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Bater o ponto',
      icon: horaIcon.resize({ width: 16, height: 16 }),
      click: async () => {
        try {
          // Realiza o login com captcha
          const cookie = await realizarLogin();
          
          if (!cookie) {
            return;
          }

          // Verifica se está logado
          const estaLogadoResult = await estaLogado(cookie);
          
          if (estaLogadoResult) {
            const date = new Date();
            const hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
            const minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();

            try {
              await baterPonto(cookie);
              
              new Notification({
                title: 'Relógio de ponto',
                subtitle: '2easy',
                body: `Ponto batido as ${hours}:${minutes}`,
                icon: horaIcon,
              }).show();
            } catch (error) {
              console.error('Erro ao bater ponto:', error);
              
              new Notification({
                title: 'Erro',
                subtitle: '2easy',
                body: 'Não foi possível bater o ponto',
                icon: horaIcon,
              }).show();
            }
          } else {
            console.log('Usuário não está logado');
            
            new Notification({
              title: 'Erro',
              subtitle: '2easy',
              body: 'Usuário não está logado',
              icon: horaIcon,
            }).show();
          }
        } catch (error) {
          console.error('Erro na operação de bater ponto:', error);
          
          new Notification({
            title: 'Erro',
            subtitle: '2easy',
            body: 'Ocorreu um erro ao tentar bater o ponto',
            icon: horaIcon,
          }).show();
        }
      }
    },
    {
      label: 'Configurações',
      icon: definicoesIcon.resize({ width: 16, height: 16 }),
      click: () => {
        configuracoes();
      }
    },
    {
      label: 'Sair',
      icon: sairIcon.resize({ width: 16, height: 16 }),
      click: () => {
        tray.destroy();
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('2easy');
});