/**
 * iframe 内に注入する window.Zisup API シム。
 * saveData / loadData を postMessage 経由で親ウィンドウにブリッジし、
 * ログイン状態に応じてクラウドまたは localStorage に保存先を自動分岐させる。
 *
 * このスクリプトは buildSrcDoc() によって全アプリの <head> 先頭に自動注入される。
 * アプリ側コード（index.html）の変更は不要。
 */
export const ZISUP_SHIM_SCRIPT = `
(function () {
  'use strict';
  var _pending = {};

  /* 親ウィンドウへメッセージを送り、Promise で応答を待つ */
  function request(msg) {
    return new Promise(function (resolve, reject) {
      var id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      _pending[id] = { resolve: resolve, reject: reject };
      msg.__zisup_id = id;
      try {
        window.parent.postMessage(msg, '*');
      } catch (e) {
        delete _pending[id];
        reject(e);
        return;
      }
      /* タイムアウト 8 秒 */
      setTimeout(function () {
        if (_pending[id]) {
          delete _pending[id];
          /* タイムアウト時はローカルフォールバック */
          reject(new Error('[Zisup] タイムアウト: 親ウィンドウと通信できませんでした'));
        }
      }, 8000);
    });
  }

  /* 親からの応答を受信してコールバックを解決 */
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.__zisup_type !== 'response') return;
    var cb = _pending[d.__zisup_id];
    if (!cb) return;
    delete _pending[d.__zisup_id];
    if (d.error) {
      cb.reject(new Error(d.error));
    } else {
      var val = null;
      try {
        val = d.value !== null && d.value !== undefined ? JSON.parse(d.value) : null;
      } catch (_) { val = null; }
      cb.resolve(val);
    }
  });

  /* ── window.Zisup 公開 API ── */
  window.Zisup = {
    /**
     * データをクラウド（ログイン時）または localStorage（未ログイン時）に保存。
     * @param {string} key   - 識別キー（例: 'score', 'settings'）
     * @param {any}    value - 保存する値（JSON シリアライズ可能）
     * @returns {Promise<void>}
     */
    saveData: function (key, value) {
      return request({ __zisup_type: 'save', key: String(key), value: JSON.stringify(value) });
    },

    /**
     * データをクラウド（ログイン時）または localStorage（未ログイン時）から読み込む。
     * @param {string} key - 識別キー
     * @returns {Promise<any>} - 保存した値、未保存なら null
     */
    loadData: function (key) {
      return request({ __zisup_type: 'load', key: String(key) });
    },
  };

  console.log('[Zisup] API ready (v2 cloud-sync)');
})();
`;
