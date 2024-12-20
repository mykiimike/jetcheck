class asEventEmitter {
  constructor() {
    this._acall = {}
  }

  async emit(ev, ...argv) {
    if (!this._acall[ev]) return;
    const list = this._acall[ev];
    for (let call of list) await call(...argv);
  }

  on(ev, cb) {
    if (!this._acall[ev]) this._acall[ev] = []
    this._acall[ev].push(cb)
  }
}

module.exports = asEventEmitter;