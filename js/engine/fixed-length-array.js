function FixedLengthArray(maxLength, initialItemValue) {

    this.items = [];
    this.length = 0;
    this.maxLength = maxLength;

    for (var i = 0; i < this.maxLength; i++) {
        this.items.push(initialItemValue);
    }
}