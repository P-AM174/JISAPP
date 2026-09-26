/**
 * iframe 内に注入する window.Zisup API シム。
 * saveData / loadData を postMessage 経由で親ウィンドウにブリッジし、
 * ログイン状態に応じてクラウドまたは localStorage に保存先を自動分岐させる。
 *
 * このスクリプトは buildSrcDoc() によって全アプリの <head> 先頭に自動注入される。
 * アプリ側コード（index.html）の変更は不要。
 */
export const ZISUP_REQUEST_TIMEOUT_MS = 55_000;

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
      /* タイムアウト（外部APIプロキシの上限15秒 + 余裕） */
      setTimeout(function () {
        if (_pending[id]) {
          delete _pending[id];
          reject(new Error('[Zisup] タイムアウト: 親ウィンドウと通信できませんでした'));
        }
      }, ${ZISUP_REQUEST_TIMEOUT_MS});
    });
  }

  /* グループ共有：他のメンバーの更新を知らせるコールバック（キーごと） */
  var _watchers = {};

  function shared(op, extra) {
    var msg = { __zisup_type: 'shared', op: op };
    for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) msg[k] = extra[k]; }
    return request(msg);
  }

  /* 親からの応答を受信してコールバックを解決 */
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (d && d.__zisup_type === 'shared_changed' && d.key && _watchers[d.key]) {
      _watchers[d.key].forEach(function (cb) { try { cb(); } catch (err) { console.error(err); } });
      return;
    }
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

    /**
     * 外部APIへHTTPSリクエスト（CORSで直接fetchできない場合用プロキシ経由）。
     * @param {string} url - https:// で始まるAPI URL
     * @param {object} [options] - method, headers, body
     * @returns {Promise<{ok:boolean,status:number,body:any}>}
     */
    fetch: function (url, options) {
      options = options || {};
      var headers = options.headers || {};
      var body = options.body;
      if (body !== undefined && body !== null && typeof body !== 'string') {
        body = JSON.stringify(body);
      }
      return request({
        __zisup_type: 'fetch',
        url: String(url),
        method: options.method || 'GET',
        headers: headers,
        body: body,
        secret: options.secret ? String(options.secret) : undefined,
      });
    },

    /**
     * グループのメンバー全員で共有するデータ。
     * グループに参加していないとき（開発スタジオなど）は、この端末だけのテスト用データとして動く。
     */
    shared: {
      /** 1つの値を共有して保存 */
      save: function (key, value) {
        return shared('set', { key: String(key), value: JSON.stringify(value) });
      },
      /** 共有している値を読み込む（なければ null） */
      load: function (key) {
        return shared('get', { key: String(key) });
      },
      /** 一覧に項目を追加（同時に入力しても消えない）。{ id, value, author, createdAt, mine } を返す */
      add: function (key, value) {
        return shared('add', { key: String(key), value: JSON.stringify(value) });
      },
      /** 一覧の項目を古い順に取得 */
      list: function (key) {
        return shared('list', { key: String(key) });
      },
      /** 項目を削除（自分の項目だけ。グループを作った人はすべて） */
      remove: function (key, id) {
        return shared('remove', { key: String(key), itemId: String(id) });
      },
      /** 他のメンバーがこのキーを更新したら呼ばれる */
      onChange: function (key, callback) {
        key = String(key);
        if (!_watchers[key]) {
          _watchers[key] = [];
          try { window.parent.postMessage({ __zisup_type: 'shared_watch', key: key }, '*'); } catch (e) { /* noop */ }
        }
        _watchers[key].push(callback);
      },
    },

    /** 自分の表示名など { id, name }。グループに参加していなければテスト用の名前 */
    me: function () {
      return shared('me', {});
    },

    /** 参加しているグループ { id, name }。参加していなければ null */
    group: function () {
      return shared('group', {});
    },
  };

  console.log('[Zisup] API ready (v4 cloud-sync + external fetch + group shared data)');
})();
`;
