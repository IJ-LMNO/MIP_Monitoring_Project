class RingBuffer {
    constructor(maxLength) {
        this.buffer = new Array(maxLength);
        this.maxLength = maxLength;

        this.start = 0;   // 가장 오래된 데이터 위치
        this.size = 0;    // 현재 저장된 데이터 개수
    }

    push(data) {

        const index =
            (this.start + this.size) % this.maxLength;


        // 아직 버퍼가 가득 차지 않은 경우
        if (this.size < this.maxLength) {

            this.buffer[index] = data;
            this.size += 1;

        }

        // 이미 가득 찬 경우
        else {

            // 가장 오래된 위치에 새 데이터 덮어쓰기
            this.buffer[this.start] = data;

            // 시작 위치를 한 칸 이동
            this.start =
                (this.start + 1) % this.maxLength;

        }
    }


    toArray() {

        const result = [];

        for (let i = 0; i < this.size; i++) {

            const index =
                (this.start + i) % this.maxLength;

            result.push(this.buffer[index]);
        }

        return result;
    }


    get length() {
        return this.size;
    }


    clear() {

        this.buffer =
            new Array(this.maxLength);

        this.start = 0;
        this.size = 0;
    }
}