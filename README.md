# Minecraft Items API

Minecraft の主要アイテムすべてを API として提供します。

> [!CAUTION]
> このコードはブログの画像をスクレイピングし、それを JSON 形式で提供するものです。使用して何らかの被害を受けた場合、私は一切の責任を負いません。

## Endpoints

- `GET /` - この API の名前を返します。
- `GET /list` - アイテムリストを返します。
  <br>
  レスポンスの例:
  ```json
  {
    "success": true,
    "cache": "HIT",
    "prefix": "/icons/1-21-4",
    "ext": "webp",
    "data": {
      "oak_log": "64-0001"
    }
  }
  ```
  <br>
  スクレイピング元のサーバーに可能な限り負荷をかけないよう、取得されたデータはDeno KVに1日間保存されます。`cache`が`HIT`となっている場合、データはKVにキャッシュされたものが使用されています。`MISS`の場合は、キャッシュがない・期限切れであるという事です。
