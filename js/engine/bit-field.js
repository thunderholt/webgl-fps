function BitField() {

    this.length = 0;//length;
    this.sizeInBytes = 0;//Math.ceil(this.length / 8);
    this.data = null;//new Uint8Array(this.sizeInBytes);

    this.getBit = function (index) {

        var byteIndex = Math.floor(index / 8);
        var bitOffset = index % 8;
        var bitMask = 0x80 >> bitOffset;

        var maskedByte = this.data[byteIndex] & bitMask;
        var bitSet = maskedByte != 0;

        return bitSet;
    }

    this.setBit = function (index) {

        var byteIndex = Math.floor(index / 8);
        var bitOffset = index % 8;
        var bitMask = 0x80 >> bitOffset;
        var invBitMask = ~bitMask;

        var byte = this.data[byteIndex];
        this.data[byteIndex] = (byte & invBitMask) | bitMask;
    }

    this.unsetBit = function (index) {

        var byteIndex = Math.floor(index / 8);
        var bitOffset = index % 8;
        var bitMask = 0x80 >> bitOffset;
        var invBitMask = ~bitMask;

        var byte = this.data[byteIndex];
        this.data[byteIndex] = (byte & invBitMask);
    }

    this.reset = function (length) {

        if (this.length != length) {
            this.length = length;
            this.sizeInBytes = Math.ceil(this.length / 8);
            this.data = new Uint8Array(this.sizeInBytes);
        }

        for (var i = 0; i < this.data.length; i++) {
            this.data[i] = 0;
        }
    }

    this.countSetBits = function () {

        var count = 0;
        for (var i = 0; i < this.length; i++) {
            if (this.getBit(i)) {
                count++;
            }
        }
        return count;
    }
}