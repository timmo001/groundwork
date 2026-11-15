# @timmo001/groundwork-auth

Groundwork's client keys: every client of a service, such as Home Assistant,
a phone, a CLI or a script, has a key of its own, so removing one stops only
that client.

```ts
import { findByKey, readBearer } from "@timmo001/groundwork-auth";
import { generateClientKey } from "@timmo001/groundwork-auth/client";

const { key, record } = await generateClientKey(
  { service: "kestrel", kind: "key" },
  { id: "pixel-9", name: "Pixel 9", kind: "phone" },
);
// Show `key` once. Keep only `record`, which holds its SHA-256.

const client = await findByKey(
  readBearer(request.headers.get("authorization")) ?? "",
  records,
);
```

- `.` makes, reads and hashes keys, shaped
  `<service>_<kind>_<random><checksum>`: 256 random bits in base62 and a
  CRC32 checksum, so a mistyped key is turned away before any lookup.
  `findByKey` compares hashes in constant time, and `bearer` and `readBearer`
  write and read the `Authorization` header.
- `./client` is what a service keeps and sends: the `ClientRecord` with the
  key's hash and scopes, the `NewKey` shown once, the `keys/exchange`
  contract for moving from one shared token, and a WebSocket's first
  `SocketAuth` message.
- `./test-vectors.json` has sample keys with their checksums and hashes, and
  keys that must be turned away, for a service in another language to check
  against.

The docs are at
[groundwork.timmo.dev/behavior#client-keys](https://groundwork.timmo.dev/behavior#client-keys).
