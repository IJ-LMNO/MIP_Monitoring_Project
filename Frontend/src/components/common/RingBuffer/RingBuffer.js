class RingBuffer {
    constructor(capacity) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);

        this.start = 0;
        this.size = 0;
    }

    push(value) {
        const index =
            (this.start + this.size) % this.capacity;

        if (this.size < this.capacity) {
            this.buffer[index] = value;
            this.size += 1;
        } else {
            this.buffer[this.start] = value;
            this.start =
                (this.start + 1) % this.capacity;
        }
    }

    toArray() {
        const result = [];

        for (let i = 0; i < this.size; i++) {
            const index =
                (this.start + i) % this.capacity;

            result.push(this.buffer[index]);
        }

        return result;
    }

    clear() {
        this.buffer = new Array(this.capacity);
        this.start = 0;
        this.size = 0;
    }

    get length() {
        return this.size;
    }
}

export default RingBuffer;