import { InMemoryMediaManager } from "./InMemoryMediaManager.js"

describe("InMemoryMediaManager", function() {
    test("store", function(done){
        const ab = new ArrayBuffer(10);
        const dv = new DataView(ab);
        dv.setUint8(0, 1)
        dv.setUint8(1, 2)
    
        const mm = new InMemoryMediaManager()
        mm.addMedia("abc", "x.png", new Blob(new Array<any>(ab)))
        .then(() => mm.hasMedia("abc"))
        .then(present => expect(present).toBeTruthy())
        .then(() => mm.hasMedia("def"))
        .then(present => expect(present).toBeFalsy())
        .then(() => mm.getMedia("x.png"))
        .then(b => b!.arrayBuffer())
        .then(ab2 => {
            expect(ab2).toBeTruthy()
            const bdv = new DataView(ab2)
            expect(bdv.getUint8(0)).toBe(1)
            expect(bdv.getUint8(1)).toBe(2)
        })
        .then(() => mm.size())
        .then(media_size => {
            expect(media_size).toBe(1)
            done()
        })
    })
})