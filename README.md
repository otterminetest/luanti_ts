# luanti_ts
luanti client typescript library. very much WIP

# Usage
You can either use this in .mjs files:
```js
import { Client } from "./luanti_ts/dist/Client.js"

const host = "address"
const port = 8000

const username = "username"
const password = "password"

const client = new Client(host, port)

await client.login(username, password)
await client.ready()
```
and compile and run with
```sh
cd luanti_ts && npx tsc && cd ../
npm run index.mjs
```

or in .ts files:
```ts
import { Client } from "./luanti_ts/src/Client.ts"

const host = "address"
const port = 8000

const username = "username"
const password = "password"

const client = new Client(host, port)

await client.login(username, password)
await client.ready()
console.log(`Connected to ${host}:${port}.`)
```
and run with `npx tsx index.ts`

# credits
credits go to https://github.com/BuckarooBanzay/meseweb