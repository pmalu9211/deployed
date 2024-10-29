"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generate() {
    const subset = "qwertyuio123456789pasdfghjklzxcvbnm";
    const length = 5;
    let id = "";
    for (let i = 0; i < length; i++) {
        id += subset[Math.floor(Math.random() * subset.length)];
    }
    return id;
}
exports.default = generate;
