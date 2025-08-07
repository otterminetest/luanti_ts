import { UdpConnection } from "./net/UdpConnection.js"
import { env } from "process"
import { CommandClient } from "./command/CommandClient.js"
import { Client } from "./Client.js"

describe("Client", function() {
    if (env.INTEGRATION_TEST != "true") {
        test.only("skip", function() {})
    }

    test("Login", function(done){
        const host = "minetest"
        const port = 30000

        const username = "test"
        const password = "enter"

        console.debug("connecting")
        const client = new Client(host, port)

        client.login(username, password)
        .then(() => client.ready())
        .then(() => client.mediamanager.size())
        .then(media_size => {
            expect(media_size).toBeGreaterThan(0)
            expect(client.nodedefs.size).toBeGreaterThan(0)
            done()
        })
        .catch(e => {
            console.error(e)
            done(e)
        })
        .finally(() => {
            client.close()
        })
    })
})