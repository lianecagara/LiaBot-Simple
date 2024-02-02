import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import gradient from 'gradient-string';
import chalk from 'chalk';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

class LiaBox {
  constructor({ api, event }) {
    if (!(this instanceof LiaBox)) {
      return new LiaBox({ api, event });
    }
    this.api = api;
    this.event = event;
  }

  async send(form, callback = () => {}) {
    if (form && form.file) {
      form.attachment = this.stream(form.file);
    }
    return await this.api.sendMessage(form, form.threadID || this.event.threadID, callback);
  }

  async reply(form, callback = () => {}) {
    if (form && form.file) {
      form.attachment = this.stream(form.file);
    }
    return await this.api.sendMessage(form, form.threadID || this.event.threadID, callback, form.messageID || this.event.messageID);
  }

  async reaction(emoji, callback = () => {}) {
    return await this.api.setMessageReaction(emoji.body || emoji, emoji.messageID || this.event.messageID, callback, true);
  }

  async fetch(url, options = {}) {
    const response = await axios.get(url, options);
    return response.data;
  }

  async stream(url, type) {
    if (url.startsWith('http') || (type === 'url' && type !== 'file')) {
      const response = await axios.get(url, { responseType: 'stream' });
      return response.data;
    } else {
      return fs.createReadStream(url);
    }
  }
}

const LIA = {};
const commands = {};

function logger(text, title) {
  
  const styledTitle = gradient.retro(`[ ${title.toUpperCase()} ]`);
  let styledText = text;
  if (typeof text === 'object') {
    console.log(styledTitle, text);
  } else {
    console.log(`${styledTitle} ${styledText}`);
  }
  
}

async function START() {
  logger('Lia Bot V1 is starting..', 'system');
  logger('> LOADING COMMANDS', 'system')
  await loadAllCommands();
  logger('All Commands Loaded!', "system");
  logger('Logging Account..', 'FCA')
  await main(JSON.parse(fs.readFileSync('cookies.json', 'utf8')));
}

async function loadAllCommands() {
  fs.readdirSync(path.join(__dirname, '/commands')).filter(index => index.endsWith('.js')).forEach(async (file) => {
    try {
      const data = await loadCommand(file);
    } catch (err) {
      logger(`Error loading ${file}: ${err.toString()}`, 'error');
      return err;
    }
  });
  return;
}

async function loadCommand(file) {
  const command = await import(`./commands/${file}`);
  if (!command.metadata || !command.metadata?.name || typeof command.metadata?.name !== 'string') {
    throw new Error('Missing command metadata');
  }
  if (!command.index || typeof command.index !== 'function') {
    throw new Error('Missing index function');
  }
  if (command.metadata.aliases && Array.isArray(command.metadata.aliases)) {
    command.metadata.aliases.forEach(alias => {
      if (commands[alias]) {
        logger(`Skipping alias ${alias} for ${command.metadata.name} command as it is already in use`, 'warning');
        return;
      }
      if (typeof alias !== 'string') {
        throw new Error(`Alias ${alias} for ${command.metadata.name} is not a string, fix it immediately`);
      }
      commands[alias] = command;
      logger(`Loaded alias ${alias} for ${command.metadata.name} command`, 'success');
    });
    commands[command.metadata.name] = command;
    logger(`Loaded command and alias for ${command.metadata.name}`, 'success');
  }
}

function main(appState) {
  const login = require('fca-unofficial');
  login({ appState }, async (err, api) => {
    if (err) {
      logger(err.error, 'error');
      return;
    }
    api.setOptions({
      logLevel: "info",
      selfListen: false,
      online: true,
      listenEvents: false
    });
    global.LIA.api = api;
    global.LIA.appState = api.getAppState();
    api.listen(async (err, event) => {
      if (err) logger(err, 'error');

      switch (event.type) {
        case 'message':
          try {
            //dipa tapos
          } catch (err) {
            logger(err, 'error');
          }
      }
    });
  });
}

START();
