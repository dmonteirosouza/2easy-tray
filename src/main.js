const { resolve } = require('path');
const { app, Menu, Tray, Notification, nativeImage, BrowserWindow, ipcMain } = require('electron');
const axios = require('axios');
const qs = require('qs');
require('dotenv').config();
const Store = require('./libs/store');

app.setAppUserModelId('2easy');

const store = new Store({
  configName: 'user-data',
  defaults: {
    login: {
      cpf: '',
      senha: ''
    }
  }
});

let mainWindow;

ipcMain.on('submit:config', (event, data) => {
  store.set('login', data);
  mainWindow.hide();

  mainWindow.webContents.send('submit:config:success', data);
});

app.whenReady().then(() => {
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

  function configuracoes() {
    mainWindow = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      title: 'Ponto 2easy',
      width: 400,
      height: 400
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
      mainWindow.webContents.send('config:store', login);
    }, 1500);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Bater o ponto',
      icon: horaIcon.resize({ width: 16, height: 16 }),
      click: () => {
        axios.post('https://www.2easy.com.br/ORIGO/asp/TransData/TransData_Login.asp', qs.stringify({
          'txtLogin': store.get('login').cpf || '',
          'txtSenha': store.get('login').senha || '',
          'hddTokenError': null,
          'hddToken': null
        }), {
          params: {
            'OPT': '1'
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
            'Content-Length': '63',
            'Origin': 'https://www.2easy.com.br',
            'Connection': 'keep-alive',
          }
        }).then(response => {
          const cookie = response.headers['set-cookie'][0] || null;

          estaLogado(cookie).then(response => {
            if (response) {
              const date = new Date();
              const hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
              const minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();

              baterPonto(cookie).then(response => {
                new Notification({
                  title: 'Relógio de ponto',
                  subtitle: '2easy',
                  body: `Ponto batido as ${hours}:${minutes}`,
                  icon: horaIcon,
                }).show();
              }).catch(error => {
                console.log('Não foi possível fazer o login');
              });
            } else {
              console.log('Não foi possível fazer o login');
            }
          }).catch(error => {
            console.log('Usuário não está logado');
          });
        }).catch(error => {
          console.log('Não foi possível fazer login');
        });
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