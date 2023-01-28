import http from "http";
import TelegramBot from "node-telegram-bot-api";
import { env } from "node:process";

const bot = new TelegramBot(env.BOT_TOKEN, { polling: true });

class State {
  constructor() {
    this._online = false;
    this._lastOnline = Date.now();
    this._waiting = true;
  }

  get online() {
    return this._online;
  }

  set online(value) {
    this._online = value;
  }

  get lastOnline() {
    return this._lastOnline;
  }

  set lastOnline(value) {
    this._lastOnline = value;
  }

  get waiting() {
    return this._waiting;
  }

  set waiting(value) {
    this._waiting = value;
  }
}

const state = new State();

http
  .createServer()
  .listen(env.PORT, () => {
    console.log(`Server is listening on port ${env.PORT}`);
  })
  .on("request", (req, res) => {
    if (req.headers["auth-token"] === env.AUTH_TOKEN) {
      setOnline();
      res.end();
    }
  });

function setOnline() {
  state.lastOnline = Date.now();
  if (state.waiting && !state.online) {
    state.online = true;
    state.waiting = false;
    bot.sendMessage(
      env.CHANNEL_ID,
      env.ONLINE_MESSAGE,
      { parse_mode: "HTML" },
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );

    console.log("Client is online");
  }
}

function setOffline() {
  if (!state.waiting && state.online) {
    state.online = false;
    state.waiting = true;
    console.log("Client is offline");

    bot.sendMessage(
      env.CHANNEL_ID,
      env.OFFLINE_MESSAGE,
      { parse_mode: "HTML" },
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }
}

setInterval(() => {
  if (state.lastOnline + env.INTERVAL < Date.now()) {
    setOffline();
  }
}, env.INTERVAL);
