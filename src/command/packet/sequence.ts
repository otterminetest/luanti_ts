
let seqNr = 65500-1

export function getNextSeqNr() {
    if (seqNr >= 65535){
        seqNr = 0;
    } else {
        seqNr++;
    }
    return seqNr;
}

export function setSeqNr(n: number) {
    seqNr = n;
}
