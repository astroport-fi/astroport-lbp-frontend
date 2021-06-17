export function mockSuccessfullyConnectedExtension(Extension, wallet) {
  Extension.mockImplementation(() => {
    return {
      _once: {},
      isAvailable: true,
      once(event, fn) {
        this._once[event] ||= [];
        this._once[event].push(fn);
      },
      connect() {
        if(this._once['onConnect']) {
          for(const fn of this._once['onConnect']) {
            fn(wallet);
          }

          delete this._once['onConnect'];
        }
      }
    }
  });
}
